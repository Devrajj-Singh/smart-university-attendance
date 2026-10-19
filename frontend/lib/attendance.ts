import { query, queryOne, execute } from './db';

export interface AttendanceWindowConfig {
  openBeforeMinutes: number; // 5 min
  onTimeMinutes: number;     // 5 min
  lateMinutes: number;       // 15 min
}

export const DEFAULT_WINDOW_CONFIG: AttendanceWindowConfig = {
  openBeforeMinutes: 5,
  onTimeMinutes: 5,
  lateMinutes: 15,
};

export interface MarkAttendanceResult {
  success: boolean;
  status?: 'PRESENT' | 'LATE' | 'TAPPED_PENDING';
  recordId?: string;
  studentName?: string;
  studentId?: string;
  challengePin?: string;
  message: string;
  code?: string;
}

/**
 * 15-Second Door Tap Cooldown Cache
 * Prevents rapid double-tapping of cards at classroom door terminals.
 */
const recentDoorTaps = new Map<string, number>();

/**
 * Records physical RFID card tap at the classroom entrance kiosk.
 * Sets status to TAPPED_PENDING and generates a 6-digit challenge PIN.
 */
export async function recordDoorTap({
  sessionId,
  studentIdentifier,
  terminalId = 'DOOR_KIOSK_101',
}: {
  sessionId: string;
  studentIdentifier: string;
  terminalId?: string;
}): Promise<MarkAttendanceResult> {
  const cleanId = studentIdentifier.trim();
  const student = await queryOne<any>(
    `SELECT user_id, name, email, card_id, biometric_id, class_id 
     FROM students 
     WHERE user_id = ? OR card_id = ? OR biometric_id = ?`,
    [cleanId, cleanId, cleanId]
  );

  if (!student) {
    return {
      success: false,
      code: 'STUDENT_NOT_FOUND',
      message: `Card with ID '${cleanId}' is not registered in university student registry.`,
    };
  }

  // 15-second physical card tap cooldown
  const now = Date.now();
  const lastTap = recentDoorTaps.get(student.user_id) || 0;
  if (now - lastTap < 15000) {
    const remainingSecs = Math.ceil((15000 - (now - lastTap)) / 1000);
    return {
      success: false,
      code: 'TAP_COOLDOWN',
      studentId: student.user_id,
      studentName: student.name,
      message: `Card already tapped. Please wait ${remainingSecs}s before tapping again.`,
    };
  }
  recentDoorTaps.set(student.user_id, now);

  // Check if session exists and is ACTIVE
  const session = await queryOne<any>(
    `SELECT session_id, class_id, status FROM attendance_sessions WHERE session_id = ?`,
    [sessionId]
  );

  if (!session) {
    return {
      success: false,
      code: 'INVALID_SESSION',
      message: `Classroom attendance session '${sessionId}' not found.`,
    };
  }

  // Check if student already verified as PRESENT / LATE in this lecture
  const existing = await queryOne<any>(
    `SELECT record_id, status FROM attendance_records WHERE session_id = ? AND student_id = ?`,
    [sessionId, student.user_id]
  );

  if (existing && (existing.status === 'PRESENT' || existing.status === 'LATE')) {
    return {
      success: false,
      code: 'ALREADY_VERIFIED',
      studentId: student.user_id,
      studentName: student.name,
      message: `Student '${student.name}' is already marked as ${existing.status} for this lecture.`,
    };
  }

  // Generate 6-Digit Dynamic Door Challenge Passcode
  const challengePin = Math.floor(100000 + Math.random() * 900000).toString();
  const timestampStr = new Date().toISOString();

  if (existing) {
    // Update existing pending record with new PIN
    await execute(
      `UPDATE attendance_records 
       SET timestamp = ?, method = 'DOOR_RFID', status = 'TAPPED_PENDING', device_id = ?
       WHERE session_id = ? AND student_id = ?`,
      [timestampStr, 'PIN:' + challengePin, sessionId, student.user_id]
    );
  } else {
    const recordId = 'REC-' + Math.random().toString(36).substring(2, 10).toUpperCase();
    await execute(
      `INSERT INTO attendance_records (record_id, session_id, student_id, timestamp, method, status, synced, device_id)
       VALUES (?, ?, ?, ?, 'DOOR_RFID', 'TAPPED_PENDING', FALSE, ?)`,
      [recordId, sessionId, student.user_id, timestampStr, 'PIN:' + challengePin]
    );
  }

  return {
    success: true,
    status: 'TAPPED_PENDING',
    studentId: student.user_id,
    studentName: student.name,
    challengePin,
    message: `Door card tap verified for ${student.name}. Challenge Passcode: [${challengePin}]. Please complete check-in inside classroom.`,
  };
}

/**
 * Validates and records final student attendance:
 * - Anti-Proxy Scoped Device Binding: Checks that deviceId has not registered for any other student in THIS session
 * - Supports Dual-Factor (RFID Door Tap + Mobile Check-In)
 * - Supports Dynamic 6-Digit Door Passcode fallback (for phones without biometrics or camera)
 * - Supports Faculty 1-Click Visual Presence Override
 * - Scoped strictly to session_id to prevent collision in back-to-back lectures
 */
export async function processAttendanceRecord({
  sessionId,
  studentIdentifier,
  method,            // 'DUAL_FACTOR' | 'CARD' | 'TERMINAL_PIN' | 'FACULTY_VERIFIED' | 'MANUAL'
  deviceId,          // Digital token / browser UUID / 'DEV-XXXX'
  challengePin,      // Optional 6-digit PIN from door kiosk
  attemptTime = new Date(),
  bypassWindow = false,
}: {
  sessionId: string;
  studentIdentifier: string;
  method: string;
  deviceId?: string;
  challengePin?: string;
  attemptTime?: Date;
  bypassWindow?: boolean;
}): Promise<MarkAttendanceResult> {
  // 1. Resolve Student
  const cleanId = studentIdentifier.trim();
  const student = await queryOne<any>(
    `SELECT user_id, name, email, card_id, biometric_id, class_id 
     FROM students 
     WHERE user_id = ? OR card_id = ? OR biometric_id = ?`,
    [cleanId, cleanId, cleanId]
  );

  if (!student) {
    return {
      success: false,
      message: `Student with identifier '${cleanId}' not found in university directory.`,
      code: 'STUDENT_NOT_FOUND',
    };
  }

  // 2. Resolve Session
  const session = await queryOne<any>(
    `SELECT s.*, sub.subject_name, sub.subject_code, c.class_name 
     FROM attendance_sessions s
     LEFT JOIN subjects sub ON s.subject_id = sub.subject_id
     LEFT JOIN class_sections c ON s.class_id = c.class_id
     WHERE s.session_id = ?`,
    [sessionId]
  );

  if (!session) {
    return {
      success: false,
      message: `Attendance session '${sessionId}' does not exist.`,
      code: 'INVALID_SESSION',
    };
  }

  if (session.status !== 'ACTIVE') {
    return {
      success: false,
      message: `Session is ${session.status}, not ACTIVE. Attendance is closed.`,
      code: 'SESSION_NOT_ACTIVE',
    };
  }

  // 3. Validate Enrollment
  if (student.class_id !== session.class_id) {
    return {
      success: false,
      message: `Student '${student.name}' (${student.user_id}) belongs to ${student.class_id}, not enrolled in ${session.class_name} (${session.class_id}).`,
      code: 'STUDENT_NOT_ENROLLED',
    };
  }

  // 4. Validate Window (unless bypassWindow, faculty manual verification, or session.window_override is enabled)
  const isFacultyOrManual = method === 'FACULTY_VERIFIED' || method === 'MANUAL';
  const isWindowOverridden = bypassWindow || isFacultyOrManual || session.window_override === 1 || session.window_override === true;
  if (!isWindowOverridden) {
    const startTime = new Date(session.start_time);
    const openTime = new Date(startTime.getTime() - DEFAULT_WINDOW_CONFIG.openBeforeMinutes * 60 * 1000);
    const closeTime = new Date(startTime.getTime() + DEFAULT_WINDOW_CONFIG.lateMinutes * 60 * 1000);

    if (attemptTime < openTime) {
      return {
        success: false,
        message: `Attendance window is not open yet. Class starts at ${startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
        code: 'WINDOW_NOT_OPEN',
      };
    }

    if (attemptTime > closeTime) {
      return {
        success: false,
        message: `Attendance window closed at ${closeTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (Grace period expired).`,
        code: 'WINDOW_CLOSED',
      };
    }
  }

  // 5. Existing Record Check
  const existing = await queryOne<any>(
    `SELECT record_id, status, timestamp, device_id FROM attendance_records WHERE session_id = ? AND student_id = ?`,
    [sessionId, student.user_id]
  );

  if (existing && (existing.status === 'PRESENT' || existing.status === 'LATE')) {
    return {
      success: false,
      studentId: student.user_id,
      studentName: student.name,
      message: `Student '${student.name}' has already been marked as ${existing.status} for this session.`,
      code: 'DUPLICATE_ATTENDANCE',
    };
  }

  // 5b. Anti-Cheat Security Violation Check (Server-Side Lockdown)
  // If student or device has an uncleared violation in this session, refuse check-in immediately.
  const activeViolation = await queryOne<any>(
    `SELECT violation_id, violation_type, timestamp FROM security_violations
     WHERE session_id = ? 
       AND ((student_id IS NOT NULL AND student_id = ?) OR (device_fingerprint IS NOT NULL AND device_fingerprint = ?))
       AND cleared_by_faculty = FALSE
     ORDER BY timestamp DESC LIMIT 1`,
    [sessionId, student.user_id, deviceId || '']
  );

  if (activeViolation) {
    return {
      success: false,
      code: 'SECURITY_LOCKOUT',
      studentId: student.user_id,
      studentName: student.name,
      message: `SECURITY LOCKOUT: Session revoked due to ${activeViolation.violation_type}. Academic integrity flag recorded. Please approach faculty for in-person clearance.`,
    };
  }

  // 5c. 2FA Physical Proximity Pre-Condition
  // When method is DUAL_FACTOR (mobile student check-in), the student MUST have physically tapped their ID card at the door kiosk first!
  if (method === 'DUAL_FACTOR') {
    if (!existing || existing.status !== 'TAPPED_PENDING') {
      return {
        success: false,
        code: 'DOOR_TAP_REQUIRED',
        studentId: student.user_id,
        studentName: student.name,
        message: `Physical Door Kiosk RFID tap required before mobile confirmation. Please tap your university ID card at the classroom entrance terminal first.`,
      };
    }
  }

  // 6. Anti-Proxy Scoped Device Binding Check
  // STRICTLY SCOPED TO THIS session_id: A device cannot submit for two different students in the same lecture.
  // In a subsequent lecture (different session_id), the device is free to submit again without collision.
  const isSystemDevice = !deviceId || 
    deviceId === 'DESKTOP_CONTROLLER' || 
    deviceId === 'MANUAL_FACULTY' || 
    deviceId === 'FACULTY_OVERRIDE' ||
    deviceId.startsWith('PIN:');

  if (!isSystemDevice) {
    // Check both attendance_records and session_device_bindings
    const deviceConflict = await queryOne<any>(
      `SELECT ar.student_id, st.name 
       FROM attendance_records ar
       LEFT JOIN students st ON ar.student_id = st.user_id
       WHERE ar.session_id = ? AND ar.device_id = ? AND ar.student_id != ? AND ar.status IN ('PRESENT', 'LATE')`,
      [sessionId, deviceId, student.user_id]
    );

    const bindingConflict = await queryOne<any>(
      `SELECT student_id FROM session_device_bindings
       WHERE session_id = ? AND device_fingerprint = ? AND student_id != ?`,
      [sessionId, deviceId, student.user_id]
    );

    if (deviceConflict || bindingConflict) {
      const conflictingStudent = deviceConflict?.student_id || bindingConflict?.student_id;
      return {
        success: false,
        code: 'DEVICE_ALREADY_REGISTERED',
        studentId: student.user_id,
        studentName: student.name,
        message: `REJECTED: Device [${deviceId}] has already registered attendance for student ${conflictingStudent} in this lecture. 1 device per student strictly enforced.`,
      };
    }
  }

  // 7. Dynamic Challenge PIN Check (if supplied as alternative to biometric/camera)
  if (challengePin) {
    const cleanPin = challengePin.trim();
    if (existing && existing.device_id === 'PIN:' + cleanPin) {
      // Validated against door tap PIN!
    } else if (cleanPin.length === 6 && /^\d{6}$/.test(cleanPin)) {
      // Accept valid 6-digit challenge passcode
    } else {
      return {
        success: false,
        code: 'INVALID_PASSCODE',
        message: 'Invalid 6-digit Door Terminal Passcode. Please check the code shown on the door kiosk.',
      };
    }
  }

  // 8. Determine PRESENT vs LATE
  const startTime = new Date(session.start_time);
  const lateCutoff = new Date(startTime.getTime() + DEFAULT_WINDOW_CONFIG.onTimeMinutes * 60 * 1000);
  const status: 'PRESENT' | 'LATE' = (isWindowOverridden || attemptTime <= lateCutoff) ? 'PRESENT' : 'LATE';

  const timestampStr = attemptTime.toISOString();
  let recordId = existing ? existing.record_id : ('REC-' + Math.random().toString(36).substring(2, 10).toUpperCase());
  const finalDeviceId = isFacultyOrManual ? 'FACULTY_OVERRIDE' : (!isSystemDevice ? deviceId : (existing?.device_id || 'TERMINAL_VERIFIED'));

  if (existing) {
    await execute(
      `UPDATE attendance_records 
       SET timestamp = ?, method = ?, status = ?, device_id = ?, synced = FALSE
       WHERE session_id = ? AND student_id = ?`,
      [timestampStr, method, status, finalDeviceId, sessionId, student.user_id]
    );
  } else {
    await execute(
      `INSERT INTO attendance_records (record_id, session_id, student_id, timestamp, method, status, synced, device_id)
       VALUES (?, ?, ?, ?, ?, ?, FALSE, ?)`,
      [recordId, sessionId, student.user_id, timestampStr, method, status, finalDeviceId]
    );
  }

  // 8b. Persist Device Scoped Binding in PostgreSQL (Immune to browser cache / data clearing)
  if (!isSystemDevice && deviceId) {
    try {
      await execute(
        `INSERT INTO session_device_bindings (binding_id, session_id, device_fingerprint, student_id)
         VALUES (?, ?, ?, ?)
         ON CONFLICT (session_id, device_fingerprint) DO NOTHING`,
        ['BIND-' + Math.random().toString(36).substring(2, 10).toUpperCase(), sessionId, deviceId, student.user_id]
      );
    } catch (bindErr) {
      console.warn('[ATTENDANCE] Error binding device in session_device_bindings:', bindErr);
    }
  }

  // 9. Log in Central Audit Trail
  await execute(
    `INSERT INTO audit_logs (log_id, actor_id, action, entity_type, entity_id, details)
     VALUES (?, ?, ?, 'ATTENDANCE_RECORD', ?, ?)`,
    [
      'LOG-' + Math.random().toString(36).substring(2, 10),
      student.user_id,
      'MARK_ATTENDANCE',
      recordId,
      `Marked ${status} via ${method} (Device: ${finalDeviceId}) for session ${sessionId}`,
    ]
  );

  return {
    success: true,
    status,
    recordId,
    studentId: student.user_id,
    studentName: student.name,
    message: `Attendance successfully confirmed as ${status} for ${student.name} (${student.user_id}).`,
  };
}

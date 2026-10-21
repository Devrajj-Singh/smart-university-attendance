import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, execute } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, studentIdentifier, deviceFingerprint, violationType, details } = body;

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required.' }, { status: 400 });
    }

    let resolvedStudentId = studentIdentifier?.trim() || null;
    let studentName = 'Unidentified Student';

    if (resolvedStudentId) {
      const student = await queryOne<any>(
        `SELECT user_id, name FROM students WHERE user_id = ? OR card_id = ? OR biometric_id = ?`,
        [resolvedStudentId, resolvedStudentId, resolvedStudentId]
      );
      if (student) {
        resolvedStudentId = student.user_id;
        studentName = student.name;
      }
    } else if (deviceFingerprint) {
      // Check if device was previously bound in this session
      const binding = await queryOne<any>(
        `SELECT b.student_id, s.name 
         FROM session_device_bindings b
         JOIN students s ON b.student_id = s.user_id
         WHERE b.session_id = ? AND b.device_fingerprint = ?`,
        [sessionId, deviceFingerprint]
      );
      if (binding) {
        resolvedStudentId = binding.student_id;
        studentName = binding.name;
      } else {
        // Also check if any student tapped pending on door kiosk
        const pendingTap = await queryOne<any>(
          `SELECT ar.student_id, s.name 
           FROM attendance_records ar
           JOIN students s ON ar.student_id = s.user_id
           WHERE ar.session_id = ? AND ar.status = 'TAPPED_PENDING'
           ORDER BY ar.timestamp DESC LIMIT 1`,
          [sessionId]
        );
        if (pendingTap) {
          resolvedStudentId = pendingTap.student_id;
          studentName = pendingTap.name;
        }
      }
    }

    const violationId = 'VIOL-' + Math.random().toString(36).substring(2, 10).toUpperCase();
    const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || 'MOBILE_BROWSER';

    // Insert into security_violations
    await execute(
      `INSERT INTO security_violations (violation_id, session_id, student_id, device_fingerprint, violation_type, details, timestamp, cleared_by_faculty)
       VALUES (?, ?, ?, ?, ?, ?, NOW(), FALSE)`,
      [
        violationId,
        sessionId,
        resolvedStudentId || 'ANONYMOUS_PROXY',
        deviceFingerprint || null,
        violationType || 'TAB_SWITCH',
        details || `Anti-cheat trigger on IP ${clientIp} (${userAgent.substring(0, 100)})`
      ]
    );

    // Record in central audit_logs for dean/admin inspection
    await execute(
      `INSERT INTO audit_logs (log_id, actor_id, action, entity_type, entity_id, details)
       VALUES (?, ?, 'SECURITY_VIOLATION', 'ATTENDANCE_SESSION', ?, ?)`,
      [
        'LOG-' + Math.random().toString(36).substring(2, 10),
        resolvedStudentId || 'SYSTEM_WATCHDOG',
        sessionId,
        `Student [${studentName} (${resolvedStudentId || 'Unknown'})] triggered ${violationType} on device [${deviceFingerprint || 'Unknown'}] in Session [${sessionId}]`
      ]
    );

    return NextResponse.json({
      success: true,
      locked: true,
      violationId,
      studentId: resolvedStudentId,
      studentName,
      message: 'Security breach logged. Attendance session revoked and recorded on central ledger.'
    });
  } catch (err: any) {
    console.error('[API/ATTENDANCE/VIOLATION] Error:', err);
    return NextResponse.json({ error: err.message || 'Server error logging violation' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');
    const studentId = searchParams.get('studentId');
    const deviceFingerprint = searchParams.get('deviceFingerprint');
    const all = searchParams.get('all') === 'true';

    if (all) {
      // List all violations for faculty or dean admin view
      let sql = `SELECT v.*, s.name as student_name, c.class_name, sub.subject_name, f.name as faculty_name, cr.room_number
                 FROM security_violations v
                 LEFT JOIN students s ON v.student_id = s.user_id
                 LEFT JOIN attendance_sessions att ON v.session_id = att.session_id
                 LEFT JOIN class_sections c ON att.class_id = c.class_id
                 LEFT JOIN subjects sub ON att.subject_id = sub.subject_id
                 LEFT JOIN faculty f ON att.actual_faculty_id = f.user_id
                 LEFT JOIN classrooms cr ON att.classroom_id = cr.classroom_id`;
      const params: any[] = [];
      if (sessionId) {
        sql += ` WHERE v.session_id = ?`;
        params.push(sessionId);
      }
      sql += ` ORDER BY v.timestamp DESC LIMIT 100`;

      const violations = await query<any>(sql, params);
      return NextResponse.json({ success: true, violations });
    }

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    // Check single student / device lockout status
    let active = null;
    if (studentId || deviceFingerprint) {
      active = await queryOne<any>(
        `SELECT v.*, s.name as student_name 
         FROM security_violations v
         LEFT JOIN students s ON v.student_id = s.user_id
         WHERE v.session_id = ? 
           AND ((v.student_id IS NOT NULL AND v.student_id = ?) OR (v.device_fingerprint IS NOT NULL AND v.device_fingerprint = ?))
           AND v.cleared_by_faculty = FALSE
         ORDER BY v.timestamp DESC LIMIT 1`,
        [sessionId, studentId || '', deviceFingerprint || '']
      );
    }

    return NextResponse.json({
      success: true,
      isLocked: !!active,
      violation: active || null
    });
  } catch (err: any) {
    console.error('[API/ATTENDANCE/VIOLATION GET] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { violationId, facultyId = 'FAC001' } = body;

    if (!violationId) {
      return NextResponse.json({ error: 'violationId required' }, { status: 400 });
    }

    let facultyUserId = facultyId;
    const fac = await queryOne<any>(
      `SELECT user_id FROM faculty WHERE user_id = ? OR login_id = ?`,
      [facultyId, facultyId]
    );
    if (fac) {
      facultyUserId = fac.user_id;
    }

    await execute(
      `UPDATE security_violations 
       SET cleared_by_faculty = TRUE, cleared_by = ?, cleared_at = NOW()
       WHERE violation_id = ?`,
      [facultyUserId, violationId]
    );

    await execute(
      `INSERT INTO audit_logs (log_id, actor_id, action, entity_type, entity_id, details)
       VALUES (?, ?, 'CLEAR_SECURITY_VIOLATION', 'SECURITY_VIOLATION', ?, ?)`,
      [
        'LOG-' + Math.random().toString(36).substring(2, 10),
        facultyUserId,
        violationId,
        `Faculty pardoned security violation ${violationId}`
      ]
    );

    return NextResponse.json({ success: true, message: 'Violation cleared by faculty.' });
  } catch (err: any) {
    console.error('[API/ATTENDANCE/VIOLATION PATCH] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

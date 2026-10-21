import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, execute } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { sessionId, mode = 'ALL' } = body;

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    // Verify session exists
    const sessions = await query<any>(
      `SELECT * FROM attendance_sessions WHERE session_id = ?`,
      [sessionId]
    );
    if (!sessions.length) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    const session = sessions[0];

    // Get all enrolled students for this class
    const students = await query<any>(
      `SELECT user_id, name, card_id FROM students WHERE class_id = ? ORDER BY user_id ASC`,
      [session.class_id]
    );

    if (mode === 'RESET') {
      await execute(
        `DELETE FROM attendance_records WHERE session_id = ?`,
        [sessionId]
      );
      await execute(
        `DELETE FROM security_violations WHERE session_id = ?`,
        [sessionId]
      );
      return NextResponse.json({
        success: true,
        message: 'Classroom attendance ledger and security violations reset successfully.',
        tappedCount: 0,
      });
    }

    if (mode === 'IMPOSTOR') {
      const targetStudent = students[1] || students[0];
      const violId = 'VIOL-' + Math.random().toString(36).substring(2, 10).toUpperCase();
      await execute(
        `INSERT INTO security_violations (violation_id, session_id, student_id, device_fingerprint, violation_type, details, timestamp, cleared_by_faculty)
         VALUES (?, ?, ?, ?, 'BIOMETRIC_MISMATCH', ?, ?, FALSE)`,
        [
          violId,
          sessionId,
          targetStudent.user_id,
          'DOOR_KIOSK_101',
          `Simulated Card-Swap: Student ${targetStudent.name} (${targetStudent.user_id}) card presented with unverified biometric (23.4% cosine similarity < 85% threshold).`,
          new Date().toISOString(),
        ]
      );

      return NextResponse.json({
        success: true,
        message: `Simulated Impostor Proxy Breach: Flagged BIOMETRIC_MISMATCH for ${targetStudent.name} at Door Kiosk 101.`,
        violationId: violId,
      });
    }

    const isBiometric = mode === 'BIOMETRIC_ALL' || mode === 'ALL';
    // Select students based on mode (ALL vs PARTIAL 85%)
    const targetStudents = mode === 'PARTIAL' 
      ? students.filter((_, idx) => idx % 6 !== 0) // ~85%
      : students;

    let updatedCount = 0;
    const timestampStr = new Date().toISOString();
    const finalMethod = isBiometric ? 'RFID_AND_IRIS' : 'DOOR_RFID';
    const finalStatus = isBiometric ? 'PRESENT' : 'TAPPED_PENDING';

    for (const student of targetStudents) {
      const challengePin = Math.floor(100000 + Math.random() * 900000).toString();
      const deviceIdStr = isBiometric ? 'DOOR_KIOSK_101' : ('PIN:' + challengePin);

      const existing = await queryOne<any>(
        `SELECT record_id, status FROM attendance_records WHERE session_id = ? AND student_id = ?`,
        [sessionId, student.user_id]
      );

      if (existing) {
        if (existing.status !== 'PRESENT' || !isBiometric) {
          await execute(
            `UPDATE attendance_records 
             SET timestamp = ?, method = ?, status = ?, device_id = ?
             WHERE session_id = ? AND student_id = ?`,
            [timestampStr, finalMethod, finalStatus, deviceIdStr, sessionId, student.user_id]
          );
          updatedCount++;
        }
      } else {
        const recordId = 'REC-' + Math.random().toString(36).substring(2, 10).toUpperCase();
        await execute(
          `INSERT INTO attendance_records (record_id, session_id, student_id, timestamp, method, status, synced, device_id)
           VALUES (?, ?, ?, ?, ?, ?, FALSE, ?)`,
          [recordId, sessionId, student.user_id, timestampStr, finalMethod, finalStatus, deviceIdStr]
        );
        updatedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: isBiometric
        ? `Dual-Factor Kiosk Verified: ${updatedCount} students authenticated via RFID Smart Card + Iris Biometrics (PRESENT).`
        : `Simulated ${updatedCount} door RFID taps (TAPPED_PENDING).`,
      tappedCount: updatedCount,
      totalEnrolled: students.length,
    });
  } catch (err: any) {
    console.error('[API/SIMULATE-DOOR-TAPS] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

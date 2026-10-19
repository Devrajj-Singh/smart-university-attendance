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
      return NextResponse.json({
        success: true,
        message: 'Door tap ledger reset successfully.',
        tappedCount: 0,
      });
    }

    // Select students based on mode (ALL vs PARTIAL 85%)
    const targetStudents = mode === 'PARTIAL' 
      ? students.filter((_, idx) => idx % 6 !== 0) // ~85%
      : students;

    let updatedCount = 0;
    const timestampStr = new Date().toISOString();

    for (const student of targetStudents) {
      const challengePin = Math.floor(100000 + Math.random() * 900000).toString();

      const existing = await queryOne<any>(
        `SELECT record_id, status FROM attendance_records WHERE session_id = ? AND student_id = ?`,
        [sessionId, student.user_id]
      );

      if (existing) {
        if (existing.status !== 'PRESENT' && existing.status !== 'LATE') {
          await execute(
            `UPDATE attendance_records 
             SET timestamp = ?, method = 'DOOR_RFID', status = 'TAPPED_PENDING', device_id = ?
             WHERE session_id = ? AND student_id = ?`,
            [timestampStr, 'PIN:' + challengePin, sessionId, student.user_id]
          );
          updatedCount++;
        }
      } else {
        const recordId = 'REC-' + Math.random().toString(36).substring(2, 10).toUpperCase();
        await execute(
          `INSERT INTO attendance_records (record_id, session_id, student_id, timestamp, method, status, synced, device_id)
           VALUES (?, ?, ?, ?, 'DOOR_RFID', 'TAPPED_PENDING', FALSE, ?)`,
          [recordId, sessionId, student.user_id, timestampStr, 'PIN:' + challengePin]
        );
        updatedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Simulated ${updatedCount} classroom door RFID card taps. Students placed in TAPPED_PENDING status.`,
      tappedCount: updatedCount,
      totalEnrolled: students.length,
    });
  } catch (err: any) {
    console.error('[API/SIMULATE-DOOR-TAPS] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

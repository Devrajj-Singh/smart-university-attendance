import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, execute } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    const session = await queryOne<any>(
      `SELECT 
        s.*,
        sub.subject_name,
        sub.subject_code,
        sub.credit_hours,
        cs.class_name,
        cs.department,
        cr.room_number,
        cr.building,
        f1.name as scheduled_faculty_name,
        f2.name as actual_faculty_name
      FROM attendance_sessions s
      LEFT JOIN subjects sub ON s.subject_id = sub.subject_id
      LEFT JOIN class_sections cs ON s.class_id = cs.class_id
      LEFT JOIN classrooms cr ON s.classroom_id = cr.classroom_id
      LEFT JOIN faculty f1 ON s.scheduled_faculty_id = f1.user_id
      LEFT JOIN faculty f2 ON s.actual_faculty_id = f2.user_id
      WHERE s.session_id = ?`,
      [sessionId]
    );

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Get all enrolled students for this session's class_section
    const enrolledStudents = await query<any>(
      `SELECT 
        st.user_id,
        st.user_id as student_id,
        st.name,
        st.email,
        st.card_id,
        st.biometric_id,
        ar.record_id,
        ar.status,
        ar.status as attendance_status,
        ar.method,
        ar.method as attendance_method,
        ar.timestamp as attendance_time,
        ar.timestamp as verified_at,
        ar.device_id,
        ar.synced as is_synced
      FROM students st
      LEFT JOIN attendance_records ar 
        ON st.user_id = ar.student_id AND ar.session_id = ?
      WHERE st.class_id = ?
      ORDER BY st.user_id ASC`,
      [sessionId, session.class_id]
    );

    // Compute stats
    const totalEnrolled = enrolledStudents.length;
    let presentCount = 0;
    let lateCount = 0;
    let pendingCount = 0;
    const pendingDoorTaps: any[] = [];

    for (const s of enrolledStudents) {
      s.student_id = s.user_id;
      const challengePin = s.device_id?.startsWith('PIN:') ? s.device_id.replace('PIN:', '') : null;
      s.challenge_pin = challengePin;

      if (s.status === 'PRESENT') {
        presentCount++;
      } else if (s.status === 'LATE') {
        lateCount++;
      } else if (s.status === 'TAPPED_PENDING') {
        pendingCount++;
        pendingDoorTaps.push(s);
      }
    }
    const absentCount = totalEnrolled - (presentCount + lateCount + pendingCount);
    const attendancePercentage = totalEnrolled > 0 ? Math.round(((presentCount + lateCount) / totalEnrolled) * 100) : 0;

    // Fetch active security violations for this session
    const violations = await query<any>(
      `SELECT v.*, s.name as student_name
       FROM security_violations v
       LEFT JOIN students s ON v.student_id = s.user_id
       WHERE v.session_id = ?
       ORDER BY v.timestamp DESC`,
      [sessionId]
    );

    return NextResponse.json({
      success: true,
      session,
      stats: {
        totalEnrolled,
        presentCount,
        lateCount,
        pendingCount,
        absentCount,
        attendancePercentage,
      },
      pendingDoorTaps,
      students: enrolledStudents,
      violations,
    });
  } catch (err: any) {
    console.error('[API/SESSION/DETAIL] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId } = await params;
    const body = await req.json();
    const { status, actualFacultyId, windowOverride } = body;

    const session = await queryOne('SELECT * FROM attendance_sessions WHERE session_id = ?', [sessionId]);
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Authorization check
    if (user.role !== 'ADMIN' && session.scheduled_faculty_id !== user.userId && session.actual_faculty_id !== user.userId) {
      return NextResponse.json({ error: 'Unauthorized to modify this session' }, { status: 403 });
    }

    if (status) {
      await execute('UPDATE attendance_sessions SET status = ? WHERE session_id = ?', [status, sessionId]);
      await execute(
        'INSERT INTO audit_logs (log_id, actor_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?, ?)',
        ['LOG-' + Math.random().toString(36).substring(2, 10), user.userId, 'UPDATE_SESSION_STATUS', 'ATTENDANCE_SESSION', sessionId, `Status changed to ${status}`]
      );
    }

    if (windowOverride !== undefined) {
      const overrideVal = windowOverride ? 1 : 0;
      await execute('UPDATE attendance_sessions SET window_override = ? WHERE session_id = ?', [overrideVal, sessionId]);
    }

    if (actualFacultyId) {
      await execute('UPDATE attendance_sessions SET actual_faculty_id = ? WHERE session_id = ?', [actualFacultyId, sessionId]);
    }

    return NextResponse.json({ success: true, message: 'Session updated successfully' });
  } catch (err: any) {
    console.error('[API/SESSION/PATCH] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

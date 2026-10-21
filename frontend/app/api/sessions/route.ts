import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, execute } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/sessions: Fetch active and recent sessions
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const { searchParams } = new URL(req.url);
    const facultyFilter = searchParams.get('facultyId');
    const statusFilter = searchParams.get('status');

    let sql = `
      SELECT 
        s.*,
        sub.subject_name,
        sub.subject_code,
        cs.class_name,
        cr.room_number,
        cr.building,
        f1.name as scheduled_faculty_name,
        f2.name as actual_faculty_name,
        (SELECT COUNT(*) FROM students st WHERE st.class_id = s.class_id) as enrolled_count,
        (SELECT COUNT(*) FROM attendance_records ar WHERE ar.session_id = s.session_id) as marked_count,
        (SELECT COUNT(*) FROM attendance_records ar WHERE ar.session_id = s.session_id AND ar.status = 'PRESENT') as present_count,
        (SELECT COUNT(*) FROM attendance_records ar WHERE ar.session_id = s.session_id AND ar.status = 'LATE') as late_count
      FROM attendance_sessions s
      LEFT JOIN subjects sub ON s.subject_id = sub.subject_id
      LEFT JOIN class_sections cs ON s.class_id = cs.class_id
      LEFT JOIN classrooms cr ON s.classroom_id = cr.classroom_id
      LEFT JOIN faculty f1 ON s.scheduled_faculty_id = f1.user_id
      LEFT JOIN faculty f2 ON s.actual_faculty_id = f2.user_id
      WHERE 1=1
    `;

    const params: any[] = [];

    if (facultyFilter) {
      sql += ' AND (s.scheduled_faculty_id = ? OR s.actual_faculty_id = ?)';
      params.push(facultyFilter, facultyFilter);
    } else if (user && user.role === 'FACULTY') {
      sql += ' AND (s.scheduled_faculty_id = ? OR s.actual_faculty_id = ?)';
      params.push(user.userId, user.userId);
    }

    if (statusFilter) {
      sql += ' AND s.status = ?';
      params.push(statusFilter);
    }

    sql += ' ORDER BY s.start_time DESC LIMIT 50';

    const sessions = await query(sql, params);
    return NextResponse.json({ success: true, sessions });
  } catch (err: any) {
    console.error('[API/SESSIONS] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/sessions: Start an automatic or manual session
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role === 'ADMIN') {
      return NextResponse.json(
        { error: 'Attendance taking is reserved for academic faculty only. Dean Administrators cannot launch attendance sessions.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { sessionType, subjectId, classId, classroomId, startTime, endTime, timetableId } = body;

    const facultyId = user.userId;
    const now = new Date();
    const pairingToken = 'PAIR-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    const sessionId = 'SES-' + Math.random().toString(36).substring(2, 10).toUpperCase();

    if (sessionType === 'AUTOMATIC') {
      // Find timetable slot
      let slot: any = null;
      if (timetableId) {
        slot = await queryOne('SELECT * FROM timetable WHERE timetable_id = ?', [timetableId]);
      } else {
        const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
        const currentDay = days[now.getDay()];
        slot = await queryOne(
          `SELECT * FROM timetable 
           WHERE faculty_id = ? AND day_of_week = ? 
           ORDER BY start_time ASC LIMIT 1`,
          [facultyId, currentDay]
        );
      }

      if (!slot) {
        return NextResponse.json(
          { error: 'No matching timetable slot found for today. Please create a manual session.' },
          { status: 400 }
        );
      }

      const todayStr = now.toISOString().split('T')[0];
      const startIso = `${todayStr}T${slot.start_time}`;
      const endIso = `${todayStr}T${slot.end_time}`;

      await execute(
        `INSERT INTO attendance_sessions 
         (session_id, subject_id, class_id, classroom_id, scheduled_faculty_id, actual_faculty_id, start_time, end_time, status, session_type, pairing_token)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', 'AUTOMATIC', ?)`,
        [sessionId, slot.subject_id, slot.class_id, slot.classroom_id, slot.faculty_id, facultyId, startIso, endIso, pairingToken]
      );

      return NextResponse.json({
        success: true,
        sessionId,
        pairingToken,
        message: 'Automatic timetable session started successfully.',
      });
    }

    // MANUAL SESSION
    if (!subjectId || !classId || !classroomId) {
      return NextResponse.json(
        { error: 'Subject, Class Section, and Classroom are required for manual sessions.' },
        { status: 400 }
      );
    }

    const startIso = startTime || now.toISOString();
    const endIso = endTime || new Date(now.getTime() + 60 * 60 * 1000).toISOString();

    await execute(
      `INSERT INTO attendance_sessions 
       (session_id, subject_id, class_id, classroom_id, scheduled_faculty_id, actual_faculty_id, start_time, end_time, status, session_type, pairing_token)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', 'MANUAL', ?)`,
      [sessionId, subjectId, classId, classroomId, facultyId, facultyId, startIso, endIso, pairingToken]
    );

    return NextResponse.json({
      success: true,
      sessionId,
      pairingToken,
      message: 'Manual attendance session created and activated.',
    });
  } catch (err: any) {
    console.error('[API/SESSIONS/CREATE] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

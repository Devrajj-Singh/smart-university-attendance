import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const { searchParams } = new URL(req.url);
    const facultyFilter = searchParams.get('facultyId');

    let sql = `
      SELECT 
        t.*,
        sub.subject_name,
        sub.subject_code,
        sub.credit_hours,
        cs.class_name,
        cs.department,
        cr.room_number,
        cr.building,
        f.name as faculty_name,
        f.login_id as faculty_login_id
      FROM timetable t
      LEFT JOIN subjects sub ON t.subject_id = sub.subject_id
      LEFT JOIN class_sections cs ON t.class_id = cs.class_id
      LEFT JOIN classrooms cr ON t.classroom_id = cr.classroom_id
      LEFT JOIN faculty f ON t.faculty_id = f.user_id
      WHERE 1=1
    `;

    const params: any[] = [];
    if (facultyFilter) {
      sql += ' AND t.faculty_id = ?';
      params.push(facultyFilter);
    } else if (user && user.role === 'FACULTY') {
      sql += ' AND t.faculty_id = ?';
      params.push(user.userId);
    }

    sql += " ORDER BY CASE t.day_of_week WHEN 'MONDAY' THEN 1 WHEN 'TUESDAY' THEN 2 WHEN 'WEDNESDAY' THEN 3 WHEN 'THURSDAY' THEN 4 WHEN 'FRIDAY' THEN 5 WHEN 'SATURDAY' THEN 6 ELSE 7 END, t.start_time ASC";

    const slots = await query(sql, params);
    return NextResponse.json({ success: true, timetable: slots });
  } catch (err: any) {
    console.error('[API/TIMETABLE] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

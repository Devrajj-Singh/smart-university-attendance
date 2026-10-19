import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const classIdFilter = searchParams.get('classId');
    const subjectIdFilter = searchParams.get('subjectId');
    const format = searchParams.get('format'); // 'csv' or 'json'

    // Get all sessions count per class/subject
    const totalSessions = await query<any>(
      `SELECT COUNT(*) as total_count FROM attendance_sessions WHERE status = 'CLOSED' OR status = 'ACTIVE'`
    );
    const totalHeld = totalSessions[0]?.total_count || 1;

    // Fetch students with attendance stats
    let sql = `
      SELECT 
        st.user_id as student_id,
        st.name as student_name,
        st.email,
        st.card_id,
        st.biometric_id,
        cs.class_name,
        COUNT(DISTINCT s.session_id) as total_held,
        COUNT(DISTINCT ar.record_id) as attended_count,
        SUM(CASE WHEN ar.status = 'PRESENT' THEN 1 ELSE 0 END) as present_count,
        SUM(CASE WHEN ar.status = 'LATE' THEN 1 ELSE 0 END) as late_count
      FROM students st
      LEFT JOIN class_sections cs ON st.class_id = cs.class_id
      LEFT JOIN attendance_sessions s ON st.class_id = s.class_id
      LEFT JOIN attendance_records ar ON st.user_id = ar.student_id AND s.session_id = ar.session_id
      WHERE 1=1
    `;

    const params: any[] = [];
    if (classIdFilter) {
      sql += ' AND st.class_id = ?';
      params.push(classIdFilter);
    }

    sql += ' GROUP BY st.user_id, st.name, st.email, st.card_id, st.biometric_id, cs.class_name ORDER BY st.user_id ASC';

    const records = await query<any>(sql, params);

    // Compute 75% rule analytics for each student
    const studentReports = records.map((r) => {
      const held = Math.max(Number(r.total_held || 0), 1);
      const attended = Number(r.attended_count || 0);
      const percentage = Math.round((attended / held) * 100);

      let status = 'SAFE'; // >= 75%
      if (percentage < 65) status = 'CRITICAL';
      else if (percentage < 75) status = 'WARNING';

      // Classes needed to reach 75%: (attended + x) / (held + x) >= 0.75  =>  x >= 3*held - 4*attended
      const neededFor75 = Math.max(0, Math.ceil(3 * held - 4 * attended));

      return {
        ...r,
        student_id: r.student_id,
        student_name: r.student_name,
        class_name: r.class_name,
        total_held: held,
        total_sessions: held,
        attended_count: attended,
        attended_sessions: attended,
        percentage,
        attendance_percentage: percentage,
        attendanceStatus: status,
        isDefaulter: percentage < 75,
        classesNeededFor75: neededFor75,
      };
    });

    if (format === 'csv') {
      const header = 'Registration No,Student Name,Class Section,Lectures Held,Attended,Present,Late,Percentage,Status,Defaulter Warning\n';
      const rows = studentReports
        .map(
          (s) =>
            `"${s.student_id}","${s.student_name}","${s.class_name}",${s.total_held},${s.attended_count},${s.present_count || 0},${s.late_count || 0},${s.percentage}%,"${s.attendanceStatus}","${s.isDefaulter ? 'YES' : 'NO'}"`
        )
        .join('\n');

      return new NextResponse(header + rows, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="university_attendance_report_${Date.now()}.csv"`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      totalStudents: studentReports.length,
      defaulterCount: studentReports.filter((s) => s.isDefaulter).length,
      reports: studentReports,
      students: studentReports,
    });
  } catch (err: any) {
    console.error('[API/REPORTS] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

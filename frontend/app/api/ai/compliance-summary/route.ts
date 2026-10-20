import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { generateAttendanceComplianceBriefing } from '@/lib/ai-agent';

export const dynamic = 'force-dynamic';

async function handleComplianceSummary(classId: string) {
  // Fetch students with attendance stats
  const sql = `
    SELECT 
      st.user_id as student_id,
      st.name,
      st.email,
      cs.class_name,
      cs.department,
      COUNT(DISTINCT s.session_id) as total_held,
      COUNT(DISTINCT ar.record_id) as attended_count
    FROM students st
    LEFT JOIN class_sections cs ON st.class_id = cs.class_id
    LEFT JOIN attendance_sessions s ON st.class_id = s.class_id
    LEFT JOIN attendance_records ar ON st.user_id = ar.student_id AND s.session_id = ar.session_id
    WHERE st.class_id = ?
    GROUP BY st.user_id, st.name, st.email, cs.class_name, cs.department
    ORDER BY st.user_id ASC
  `;

  const records = await query<any>(sql, [classId]);

  const studentData = (records || []).map((r) => {
    const total = Math.max(Number(r.total_held || 0), 1);
    const attended = Number(r.attended_count || 0);
    const percentage = Math.round((attended / total) * 1000) / 10;
    return {
      student_id: r.student_id,
      name: r.name,
      attended_count: attended,
      total_sessions: total,
      attendance_percentage: percentage,
    };
  });

  const department = records[0]?.department || 'Computer Science & Engineering';
  const classSection = records[0]?.class_name || 'CSE-A';

  const briefing = await generateAttendanceComplianceBriefing(
    studentData,
    department,
    classSection
  );

  return {
    success: true,
    briefing,
  };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const classId = searchParams.get('classId') || 'CLS001';
    const result = await handleComplianceSummary(classId);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error generating AI compliance summary (GET):', error);
    return NextResponse.json(
      { error: 'Failed to generate AI compliance briefing', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // Empty or non-JSON body
    }
    const classId = body.classId || body.class_id || 'CLS001';
    const result = await handleComplianceSummary(classId);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error generating AI compliance summary (POST):', error);
    return NextResponse.json(
      { error: 'Failed to generate AI compliance briefing', details: error.message },
      { status: 500 }
    );
  }
}

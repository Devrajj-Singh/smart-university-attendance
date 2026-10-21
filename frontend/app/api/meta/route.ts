import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const subjects = await query('SELECT * FROM subjects ORDER BY subject_name ASC');
    const classrooms = await query('SELECT * FROM classrooms ORDER BY room_number ASC');
    const sections = await query('SELECT * FROM class_sections ORDER BY class_name ASC');
    const faculty = await query('SELECT user_id, login_id, name, department, email FROM faculty ORDER BY name ASC');

    return NextResponse.json({
      success: true,
      subjects,
      classrooms,
      sections,
      faculty,
    });
  } catch (err: any) {
    console.error('[API/META] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, execute } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const counts = await queryOne<any>(`
      SELECT 
        COUNT(*) as total_records,
        SUM(CASE WHEN synced = FALSE OR synced IS NULL THEN 1 ELSE 0 END) as pending_sync,
        SUM(CASE WHEN synced = TRUE THEN 1 ELSE 0 END) as synced_records
      FROM attendance_records
    `);

    const recentPending = await query<any>(`
      SELECT 
        ar.record_id,
        ar.session_id,
        ar.student_id,
        st.name as student_name,
        ar.method,
        ar.status,
        ar.timestamp,
        ar.device_id
      FROM attendance_records ar
      LEFT JOIN students st ON ar.student_id = st.user_id
      WHERE ar.synced = FALSE OR ar.synced IS NULL
      ORDER BY ar.timestamp DESC
      LIMIT 20
    `);

    const offlineNodes = await query<any>(`
      SELECT 
        f.user_id as faculty_id,
        f.name as faculty_name,
        f.login_id as faculty_login_id,
        cr.room_number,
        sub.subject_code,
        sub.subject_name,
        COUNT(ar.record_id) as pending_records_count
      FROM attendance_records ar
      JOIN attendance_sessions s ON ar.session_id = s.session_id
      LEFT JOIN faculty f ON COALESCE(s.actual_faculty_id, s.scheduled_faculty_id) = f.user_id
      LEFT JOIN classrooms cr ON s.classroom_id = cr.classroom_id
      LEFT JOIN subjects sub ON s.subject_id = sub.subject_id
      WHERE ar.synced = FALSE OR ar.synced IS NULL
      GROUP BY f.user_id, f.name, f.login_id, cr.room_number, sub.subject_code, sub.subject_name
    `);

    return NextResponse.json({
      success: true,
      stats: {
        totalRecords: counts?.total_records || 0,
        pendingSync: counts?.pending_sync || 0,
        syncedRecords: counts?.synced_records || 0,
      },
      offlineNodes,
      pendingItems: recentPending,
    });
  } catch (err: any) {
    console.error('[API/SYNC/GET] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Mark pending records as synced
    const res = await execute(`UPDATE attendance_records SET synced = TRUE WHERE synced = FALSE OR synced IS NULL`);

    await execute(
      `INSERT INTO audit_logs (log_id, actor_id, action, entity_type, details)
       VALUES (?, ?, 'FLUSH_OFFLINE_SYNC', 'SYNC_QUEUE', ?)`,
      ['LOG-' + Math.random().toString(36).substring(2, 10), user.userId, `Synchronized ${res.changes} offline attendance records to Central University Backend.`]
    );

    return NextResponse.json({
      success: true,
      syncedCount: res.changes,
      message: `Successfully synchronized ${res.changes} offline attendance records.`,
    });
  } catch (err: any) {
    console.error('[API/SYNC/POST] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

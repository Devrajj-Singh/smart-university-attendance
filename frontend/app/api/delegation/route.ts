import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, execute } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const sql = `
      SELECT 
        fd.*,
        f1.name as original_faculty_name,
        f1.email as original_faculty_email,
        f2.name as substitute_faculty_name,
        f2.email as substitute_faculty_email,
        sub.subject_name,
        sub.subject_code,
        cs.class_name,
        cr.room_number,
        t.start_time,
        t.end_time,
        t.day_of_week
      FROM faculty_delegations fd
      LEFT JOIN faculty f1 ON fd.original_faculty_id = f1.user_id
      LEFT JOIN faculty f2 ON fd.substitute_faculty_id = f2.user_id
      LEFT JOIN timetable t ON fd.timetable_id = t.timetable_id
      LEFT JOIN subjects sub ON t.subject_id = sub.subject_id
      LEFT JOIN class_sections cs ON t.class_id = cs.class_id
      LEFT JOIN classrooms cr ON t.classroom_id = cr.classroom_id
      ORDER BY fd.created_at DESC
    `;

    const delegations = await query(sql);
    return NextResponse.json({ success: true, delegations });
  } catch (err: any) {
    console.error('[API/DELEGATION] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { timetableId, substituteFacultyId, date, reason } = body;

    if (!timetableId || !substituteFacultyId) {
      return NextResponse.json({ error: 'Timetable Slot and Substitute Faculty are required.' }, { status: 400 });
    }

    if (user.userId === substituteFacultyId) {
      return NextResponse.json({ error: 'Cannot delegate a lecture to yourself.' }, { status: 400 });
    }

    const delegationId = 'DEL-' + Math.random().toString(36).substring(2, 10).toUpperCase();
    const delegationDate = date || new Date().toISOString().split('T')[0];

    await execute(
      `INSERT INTO faculty_delegations 
       (delegation_id, timetable_id, original_faculty_id, substitute_faculty_id, date, reason, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'PENDING', CURRENT_TIMESTAMP)`,
      [delegationId, timetableId, user.userId, substituteFacultyId, delegationDate, reason || 'Academic substitution']
    );

    await execute(
      `INSERT INTO audit_logs (log_id, actor_id, action, entity_type, entity_id, details)
       VALUES (?, ?, 'REQUEST_DELEGATION', 'FACULTY_DELEGATION', ?, ?)`,
      ['LOG-' + Math.random().toString(36).substring(2, 10), user.userId, delegationId, `Requested substitute ${substituteFacultyId}`]
    );

    return NextResponse.json({ success: true, delegationId, message: 'Delegation request submitted for approval.' });
  } catch (err: any) {
    console.error('[API/DELEGATION/POST] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { delegationId, action } = body; // action: 'APPROVE' | 'REJECT' | 'REVOKE'

    const delegation = await queryOne('SELECT * FROM faculty_delegations WHERE delegation_id = ?', [delegationId]);
    if (!delegation) {
      return NextResponse.json({ error: 'Delegation not found' }, { status: 404 });
    }

    let newStatus = 'PENDING';
    if (action === 'APPROVE') newStatus = 'APPROVED';
    else if (action === 'REJECT') newStatus = 'REJECTED';
    else if (action === 'REVOKE') newStatus = 'REVOKED';

    await execute(
      'UPDATE faculty_delegations SET status = ?, approved_by = ? WHERE delegation_id = ?',
      [newStatus, user.userId, delegationId]
    );

    // If delegation is approved and linked to an active session, update actual_faculty_id
    if ((newStatus === 'APPROVED' || newStatus === 'ACTIVE') && delegation.session_id) {
      await execute(
        'UPDATE attendance_sessions SET actual_faculty_id = ? WHERE session_id = ?',
        [delegation.substitute_faculty_id, delegation.session_id]
      );
    }

    await execute(
      `INSERT INTO audit_logs (log_id, actor_id, action, entity_type, entity_id, details)
       VALUES (?, ?, 'UPDATE_DELEGATION', 'FACULTY_DELEGATION', ?, ?)`,
      ['LOG-' + Math.random().toString(36).substring(2, 10), user.userId, delegationId, `Updated delegation status to ${newStatus}`]
    );

    return NextResponse.json({ success: true, message: `Delegation status updated to ${newStatus}` });
  } catch (err: any) {
    console.error('[API/DELEGATION/PATCH] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

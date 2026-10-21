import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { dispatchWebhookEvent } from '@/lib/webhooks';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Admin role required' }, { status: 403 });
    }

    const body = await req.json();
    const eventType = body.eventType || 'compliance.threshold.breach';

    let testData: any = {};

    if (eventType === 'compliance.threshold.breach') {
      testData = {
        student_id: '25215114',
        student_name: 'Arjun Sharma',
        class_id: 'CLS001',
        department: 'Computer Science & Engineering',
        attendance_percentage: 68.2,
        total_sessions: 22,
        attended_sessions: 15,
        shortfall_sessions: 2,
        statutory_tier: 'WARNING_ZONE',
        parent_phone: '+919876543210',
        parent_email: 'parents.arjun@example.edu',
        recommended_action: 'Automated Parent Warning SMS via Twilio',
      };
    } else if (eventType === 'compliance.statutory.critical') {
      testData = {
        student_id: '25215132',
        student_name: 'Rohan Gupta',
        class_id: 'CLS001',
        department: 'Computer Science & Engineering',
        attendance_percentage: 59.1,
        total_sessions: 22,
        attended_sessions: 13,
        shortfall_sessions: 4,
        statutory_tier: 'STATUTORY_CRITICAL',
        parent_phone: '+919876543211',
        action_required: 'Barred from Exam Hall Ticket - Dean Review Mandated',
      };
    } else if (eventType === 'security.impostor_detected') {
      testData = {
        student_id: '25215108',
        student_name: 'Ananya Roy',
        card_uid: 'NFC-5108',
        cosine_similarity: 0.618,
        threshold: 0.85,
        location: 'Door Terminal 101',
        violation_type: 'BIOMETRIC_MISMATCH',
        flagged_at: new Date().toISOString(),
      };
    } else {
      testData = {
        session_id: 'SESS_SAMPLE_001',
        subject_name: 'Data Structures & Algorithms',
        subject_code: 'CS201',
        class_name: 'CSE-A',
        faculty_name: 'Dr. Anita Rao',
        total_enrolled: 65,
        present_count: 58,
        attendance_rate_pct: 89.2,
        closed_at: new Date().toISOString(),
      };
    }

    const deliveryLogs = await dispatchWebhookEvent(eventType, testData);

    return NextResponse.json({
      success: true,
      message: `Test event '${eventType}' dispatched to ${deliveryLogs.length} active webhook listener(s).`,
      deliveries: deliveryLogs,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

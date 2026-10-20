import { NextRequest, NextResponse } from 'next/server';
import { processAttendanceRecord, recordDoorTap } from '@/lib/attendance';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      sessionId, 
      studentIdentifier, 
      method, 
      deviceId, 
      challengePin, 
      action, 
      confidenceScore,
      overrideTime,
      bypassWindow 
    } = body;

    if (!sessionId || !studentIdentifier) {
      return NextResponse.json(
        { error: 'Session ID and Student Identifier (Registration Number, Card UID, or Biometric ID) are required.' },
        { status: 400 }
      );
    }

    // Physical RFID Card Tap at Door Kiosk Terminal
    if (action === 'DOOR_TAP') {
      const tapResult = await recordDoorTap({
        sessionId,
        studentIdentifier,
        terminalId: deviceId || 'DOOR_KIOSK_101',
      });

      if (!tapResult.success) {
        return NextResponse.json(
          {
            success: false,
            error: tapResult.message,
            code: tapResult.code,
            studentName: tapResult.studentName,
            studentId: tapResult.studentId,
          },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        status: tapResult.status,
        studentId: tapResult.studentId,
        studentName: tapResult.studentName,
        challengePin: tapResult.challengePin,
        message: tapResult.message,
      });
    }

    // Final Mobile / Terminal / Faculty Verification
    const attemptTime = overrideTime ? new Date(overrideTime) : new Date();
    const isFacultyOrManual = method === 'FACULTY_VERIFIED' || method === 'MANUAL';
    const effectiveBypassWindow = Boolean(bypassWindow) || isFacultyOrManual;
    const effectiveDeviceId = deviceId || (isFacultyOrManual ? 'DESKTOP_CONTROLLER' : 'MOBILE_TERMINAL');

    const result = await processAttendanceRecord({
      sessionId,
      studentIdentifier,
      method: method || 'CARD',
      deviceId: effectiveDeviceId,
      challengePin,
      confidenceScore,
      attemptTime,
      bypassWindow: effectiveBypassWindow,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.message,
          code: result.code,
          studentName: result.studentName,
          studentId: result.studentId,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      status: result.status,
      recordId: result.recordId,
      studentId: result.studentId,
      studentName: result.studentName,
      message: result.message,
    });
  } catch (err: any) {
    console.error('[API/ATTENDANCE/MARK] Error:', err);
    return NextResponse.json(
      { error: err.message || 'An unexpected error occurred while marking attendance.' },
      { status: 500 }
    );
  }
}

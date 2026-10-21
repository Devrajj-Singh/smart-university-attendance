// Automated Anti-Cheat, Door Tap 2FA, and Device Scoped Verification
const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('=== STARTING AIRTIGHT SECURITY & E2E VERIFICATION ===\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  }

  try {
    // 1. Authenticate Faculty
    console.log('--- Step 1: Faculty Authentication & Session Setup ---');
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        loginId: 'F001',
        password: 'faculty123',
        portalRole: 'FACULTY',
      }),
    });
    const loginData = await loginRes.json();
    assert(loginRes.status === 200 && loginData.success, 'Faculty authenticated');
    const authCookie = loginRes.headers.get('set-cookie');

    // Create fresh Active Session
    const sessRes = await fetch(`${BASE_URL}/api/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: authCookie,
      },
      body: JSON.stringify({
        sessionType: 'MANUAL',
        subjectId: 'SUB001',
        classId: 'CLS001',
        classroomId: 'ROOM001',
      }),
    });
    const sessData = await sessRes.json();
    assert(sessRes.status === 200 && sessData.success, `Active session created: ${sessData.sessionId}`);
    const sessionId = sessData.sessionId;

    // Window override to test
    await fetch(`${BASE_URL}/api/sessions/${sessionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: authCookie },
      body: JSON.stringify({ windowOverride: 1, status: 'ACTIVE' }),
    });

    // 2. Test Security Hole Fix: Student tries to mark attendance WITHOUT tapping door kiosk first
    console.log('\n--- Step 2: Test 2FA Door Tap Pre-condition ---');
    const directCheckinRes = await fetch(`${BASE_URL}/api/attendance/mark`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        studentIdentifier: '25215111', // Valid enrolled student
        method: 'DUAL_FACTOR',
        deviceId: 'DEV-TEST-PHONE-1',
      }),
    });
    const directCheckinData = await directCheckinRes.json();
    assert(
      directCheckinRes.status === 400 && directCheckinData.code === 'DOOR_TAP_REQUIRED',
      `Reject direct mobile check-in without door tap: Got code '${directCheckinData.code}'`
    );

    // 3. Physical Door Tap at Kiosk Terminal
    console.log('\n--- Step 3: Record Door RFID Tap at Entrance Kiosk ---');
    const doorTapRes = await fetch(`${BASE_URL}/api/attendance/mark`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        studentIdentifier: '25215111',
        action: 'DOOR_TAP',
        deviceId: 'DOOR_KIOSK_101',
      }),
    });
    const doorTapData = await doorTapRes.json();
    assert(
      doorTapData.success && doorTapData.status === 'TAPPED_PENDING',
      `Door RFID Tap registered as TAPPED_PENDING for ${doorTapData.studentName}`
    );

    // 4. Now Mobile Check-In with Device Fingerprint & Biometrics
    console.log('\n--- Step 4: Confirm Mobile Presence AFTER Door Tap ---');
    const validMobileRes = await fetch(`${BASE_URL}/api/attendance/mark`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        studentIdentifier: '25215111',
        method: 'DUAL_FACTOR',
        deviceId: 'DEV-TEST-PHONE-1',
      }),
    });
    const validMobileData = await validMobileRes.json();
    assert(
      validMobileData.success && (validMobileData.status === 'PRESENT' || validMobileData.status === 'LATE'),
      `Attendance confirmed successfully after physical door tap (${validMobileData.status})`
    );

    // 5. Test 1-Device per Student Proxy Prevention
    console.log('\n--- Step 5: Test Scoped 1-Device-1-Student Anti-Proxy ---');
    // Another student taps door kiosk
    await fetch(`${BASE_URL}/api/attendance/mark`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        studentIdentifier: '25215112',
        action: 'DOOR_TAP',
        deviceId: 'DOOR_KIOSK_101',
      }),
    });

    // Student 25215112 attempts to check in using Student 25215111's phone ('DEV-TEST-PHONE-1')
    const proxyAttemptRes = await fetch(`${BASE_URL}/api/attendance/mark`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        studentIdentifier: '25215112',
        method: 'DUAL_FACTOR',
        deviceId: 'DEV-TEST-PHONE-1',
      }),
    });
    const proxyAttemptData = await proxyAttemptRes.json();
    assert(
      proxyAttemptRes.status === 400 && proxyAttemptData.code === 'DEVICE_ALREADY_REGISTERED',
      `Reject proxy attempt from same device for second student: Got code '${proxyAttemptData.code}'`
    );

    // 6. Test Strict Anti-Cheat Watchdog Trigger (Tab Switch / Blur / Notification Pull)
    console.log('\n--- Step 6: Test Strict Anti-Cheat Tab Switch / Notification Pull Logging ---');
    const breachRes = await fetch(`${BASE_URL}/api/attendance/violation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        studentIdentifier: '25215113',
        deviceFingerprint: 'DEV-TEST-PHONE-2',
        violationType: 'NOTIFICATION_DRAWER_OR_MULTIWINDOW',
        details: 'Student pulled mobile notification shade during check-in',
      }),
    });
    const breachData = await breachRes.json();
    assert(
      breachData.success && breachData.locked === true && breachData.violationId,
      `Anti-cheat logged violation: Ref [${breachData.violationId}], Locked: ${breachData.locked}`
    );

    // 7. Verify Server-Side Lockout Persists Across Refresh / Cache Clearing
    console.log('\n--- Step 7: Verify Server-Side Lockout Immunity to Cache Clearing ---');
    // Door tap for student 25215113
    await fetch(`${BASE_URL}/api/attendance/mark`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        studentIdentifier: '25215113',
        action: 'DOOR_TAP',
        deviceId: 'DOOR_KIOSK_101',
      }),
    });

    // Student 25215113 attempts to mark attendance after breach was logged
    const lockedAttemptRes = await fetch(`${BASE_URL}/api/attendance/mark`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        studentIdentifier: '25215113',
        method: 'DUAL_FACTOR',
        deviceId: 'DEV-TEST-PHONE-2',
      }),
    });
    const lockedAttemptData = await lockedAttemptRes.json();
    assert(
      lockedAttemptRes.status === 400 && lockedAttemptData.code === 'SECURITY_LOCKOUT',
      `Locked student immediately rejected by server: Got code '${lockedAttemptData.code}'`
    );

    // Check status via GET endpoint (simulating page refresh or incognito lookup)
    const checkStatusRes = await fetch(
      `${BASE_URL}/api/attendance/violation?sessionId=${sessionId}&studentId=25215113&deviceFingerprint=DEV-TEST-PHONE-2`
    );
    const checkStatusData = await checkStatusRes.json();
    assert(
      checkStatusData.isLocked === true,
      `Lockout query persists on server across refresh (isLocked: ${checkStatusData.isLocked})`
    );

    // 8. Test Faculty Session Alert Endpoint
    console.log('\n--- Step 8: Faculty Session Detail Alert Endpoint ---');
    const sessDetailRes = await fetch(`${BASE_URL}/api/sessions/${sessionId}`);
    const sessDetailData = await sessDetailRes.json();
    assert(
      sessDetailData.success && Array.isArray(sessDetailData.violations) && sessDetailData.violations.length > 0,
      `Faculty session detail received ${sessDetailData.violations?.length} violation(s) for live alert banner`
    );

    // 9. Test Faculty Pardon Action
    console.log('\n--- Step 9: Faculty Pardon Security Violation ---');
    const pardonRes = await fetch(`${BASE_URL}/api/attendance/violation`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        violationId: breachData.violationId,
        facultyId: 'F001',
      }),
    });
    const pardonData = await pardonRes.json();
    assert(pardonData.success === true, 'Faculty successfully pardoned violation');

    // 10. Test Dean Admin Global Audit Inspection
    console.log('\n--- Step 10: Dean Admin Global Anti-Cheat Audit Trail ---');
    const adminViolRes = await fetch(`${BASE_URL}/api/attendance/violation?all=true`);
    const adminViolData = await adminViolRes.json();
    assert(
      adminViolData.success && Array.isArray(adminViolData.violations) && adminViolData.violations.length > 0,
      `Dean Admin Console received ${adminViolData.violations?.length} violations in global audit trail`
    );

  } catch (err) {
    console.error('Fatal test error:', err);
    failed++;
  }

  console.log(`\n=== RESULTS: ${passed} PASSED, ${failed} FAILED ===\n`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests();

// Automated End-to-End System Test Suite
const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('====================================================');
  console.log('🧪 Starting Smart Attendance System E2E Test Suite');
  console.log('   Includes 2FA Physical RFID & Scoped Device Anti-Proxy');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Captcha Generation
    console.log('[TEST 1] Security Captcha Generation');
    const capRes = await fetch(`${BASE_URL}/api/auth/captcha`);
    const capData = await capRes.json();
    assert(capRes.status === 200 && capData.code && capData.code.length === 4, 'Generated 4-char security captcha');

    // 2. LAN IP Discovery & Scannable QR Engine
    console.log('\n[TEST 2] Host LAN IP Discovery & High-Res QR Engine');
    const lanRes = await fetch(`${BASE_URL}/api/network/lan-ip`);
    const lanData = await lanRes.json();
    assert(lanRes.status === 200 && lanData.success && lanData.baseUrl, `Resolved LAN Base URL: ${lanData.baseUrl}`);

    const qrRes = await fetch(`${BASE_URL}/api/qr?text=http://test-attendance-url&width=200`);
    const qrSvg = await qrRes.text();
    assert(qrRes.status === 200 && qrSvg.includes('<svg'), 'Generated valid SVG QR code vector');

    // 3. Faculty Authentication (F001)
    console.log('\n[TEST 3] Faculty Authentication (Dr. Anita Rao - F001)');
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
    assert(loginRes.status === 200 && loginData.success, 'Faculty authenticated successfully');
    assert(loginData.user.name === 'Dr. Anita Rao', 'User resolved as Dr. Anita Rao');
    assert(loginData.user.role === 'FACULTY', 'Role verified as FACULTY');

    const authCookie = loginRes.headers.get('set-cookie');
    assert(!!authCookie, 'Auth JWT cookie received');

    // 4. User Profile Verification (/api/auth/me)
    console.log('\n[TEST 4] Session Cookie Verification');
    const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Cookie: authCookie },
    });
    const meData = await meRes.json();
    assert(meRes.status === 200 && meData.authenticated && meData.user.loginId === 'F001', 'Session token decoded and verified');

    // 5. Create Session 1 (CS201 Data Structures)
    console.log('\n[TEST 5] Lecture Session Activation (CS201 Data Structures)');
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
    assert(sessRes.status === 200 && sessData.success && sessData.sessionId, 'Lecture 1 created and activated');
    const sessionId = sessData.sessionId;

    // Unlock attendance window for testing off-hours
    await fetch(`${BASE_URL}/api/sessions/${sessionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: authCookie },
      body: JSON.stringify({ windowOverride: 1 }),
    });

    // 6. Door Terminal Physical RFID Card Tap & Challenge PIN Generation
    console.log('\n[TEST 6] Door Terminal Physical RFID Card Tap (Kiosk Mode)');
    const doorTapRes = await fetch(`${BASE_URL}/api/attendance/mark`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        studentIdentifier: '25215101',
        action: 'DOOR_TAP',
        deviceId: 'DOOR_KIOSK_101',
      }),
    });
    const doorTapData = await doorTapRes.json();
    assert(doorTapRes.status === 200 && doorTapData.success, 'RFID ID card tapped at door kiosk');
    assert(doorTapData.status === 'TAPPED_PENDING', 'Student placed in TAPPED_PENDING state');
    assert(doorTapData.challengePin && doorTapData.challengePin.length === 6, `Generated 6-digit challenge PIN: [${doorTapData.challengePin}]`);

    // 7. Door Tap 15-Second Cooldown Enforcement
    console.log('\n[TEST 7] Door Kiosk Anti-Spam: 15-Second Cooldown Enforcement');
    const rapidTapRes = await fetch(`${BASE_URL}/api/attendance/mark`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        studentIdentifier: '25215101',
        action: 'DOOR_TAP',
        deviceId: 'DOOR_KIOSK_101',
      }),
    });
    const rapidTapData = await rapidTapRes.json();
    assert(rapidTapRes.status === 400 && rapidTapData.code === 'TAP_COOLDOWN', 'Rapid double card tap blocked with TAP_COOLDOWN');

    // 8. Dual-Factor Mobile Confirmation
    console.log('\n[TEST 8] Dual-Factor Mobile Confirmation (Completing Door Tap)');
    const confirmRes = await fetch(`${BASE_URL}/api/attendance/mark`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        studentIdentifier: '25215101',
        method: 'DUAL_FACTOR',
        deviceId: 'DEV-A1B2C',
        bypassWindow: true,
      }),
    });
    const confirmData = await confirmRes.json();
    assert(confirmRes.status === 200 && confirmData.success, 'Student 25215101 confirmed presence via phone');
    assert(confirmData.status === 'PRESENT', 'Status upgraded from TAPPED_PENDING to PRESENT');

    // 9. Anti-Proxy Scoped Device Binding: Same Lecture Rejection
    console.log('\n[TEST 9] Anti-Proxy Rule: Device Binding Scoped to Lecture Session');
    const proxyAttemptRes = await fetch(`${BASE_URL}/api/attendance/mark`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        studentIdentifier: '25215102', // Different student
        method: 'DUAL_FACTOR',
        deviceId: 'DEV-A1B2C',       // SAME device that student 25215101 used!
        bypassWindow: true,
      }),
    });
    const proxyAttemptData = await proxyAttemptRes.json();
    assert(
      proxyAttemptRes.status === 400 && proxyAttemptData.code === 'DEVICE_ALREADY_REGISTERED',
      'Blocked proxy attempt with DEVICE_ALREADY_REGISTERED'
    );
    assert(
      proxyAttemptData.error.includes('already registered attendance for student 25215101'),
      'Detailed rejection message identifies previous student registration'
    );

    // 10. Non-Biometric Hardware Alternative: 6-Digit Door Terminal Passcode
    console.log('\n[TEST 10] Alternative Verification (No Biometric Hardware Required): 6-Digit Passcode');
    // First tap door card for student 25215103
    const tap3Res = await fetch(`${BASE_URL}/api/attendance/mark`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        studentIdentifier: '25215103',
        action: 'DOOR_TAP',
        deviceId: 'DOOR_KIOSK_101',
      }),
    });
    const tap3Data = await tap3Res.json();
    const pin3 = tap3Data.challengePin;

    // Student verifies on phone using the 6-digit challenge PIN
    const pinVerifyRes = await fetch(`${BASE_URL}/api/attendance/mark`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        studentIdentifier: '25215103',
        method: 'TERMINAL_PIN',
        challengePin: pin3,
        deviceId: 'DEV-PHONE-3',
        bypassWindow: true,
      }),
    });
    const pinVerifyData = await pinVerifyRes.json();
    assert(pinVerifyRes.status === 200 && pinVerifyData.success, 'Student 25215103 verified using 6-Digit Door Kiosk PIN');
    assert(pinVerifyData.status === 'PRESENT', 'Recorded as PRESENT without biometric sensors');

    // 11. Dead Phone Battery Fallback: Faculty 1-Click Visual Presence Override
    console.log('\n[TEST 11] Dead Phone Battery Fallback: Faculty 1-Click Verification from Door Ledger');
    // Student 25215104 taps at door
    await fetch(`${BASE_URL}/api/attendance/mark`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        studentIdentifier: '25215104',
        action: 'DOOR_TAP',
        deviceId: 'DOOR_KIOSK_101',
      }),
    });

    // Check that pendingDoorTaps ledger reflects student 25215104
    const ledgerRes = await fetch(`${BASE_URL}/api/sessions/${sessionId}`);
    const ledgerData = await ledgerRes.json();
    const pendingStudent = ledgerData.pendingDoorTaps.find((s) => s.user_id === '25215104');
    assert(!!pendingStudent, 'Student 25215104 visible in Faculty Door Tap Ledger');

    // Faculty clicks "Verify Physical Presence"
    const facultyVerifyRes = await fetch(`${BASE_URL}/api/attendance/mark`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        studentIdentifier: '25215104',
        method: 'FACULTY_VERIFIED',
        deviceId: 'DESKTOP_CONTROLLER',
        bypassWindow: true,
      }),
    });
    const facultyVerifyData = await facultyVerifyRes.json();
    assert(facultyVerifyRes.status === 200 && facultyVerifyData.success, 'Faculty successfully verified presence with 1 click');

    // 12. Cross-Session Device Independence (Back-to-Back Classes)
    console.log('\n[TEST 12] Cross-Session Device Independence: Back-to-Back Lectures (No Collision)');
    // Create Lecture 2 (e.g. next consecutive class for Section B)
    const sess2Res = await fetch(`${BASE_URL}/api/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: authCookie,
      },
      body: JSON.stringify({
        sessionType: 'MANUAL',
        subjectId: 'SUB002',
        classId: 'CLS002',
        classroomId: 'ROOM002',
      }),
    });
    const sess2Data = await sess2Res.json();
    const sessionId2 = sess2Data.sessionId;

    // Student in Lecture 2 uses DEV-A1B2C (which was used in Lecture 1)
    const backToBackRes = await fetch(`${BASE_URL}/api/attendance/mark`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: sessionId2,
        studentIdentifier: '25215136', // Section B student
        method: 'DUAL_FACTOR',
        deviceId: 'DEV-A1B2C',        // Re-using device in a DIFFERENT session
        bypassWindow: true,
      }),
    });
    const backToBackData = await backToBackRes.json();
    assert(
      backToBackRes.status === 200 && backToBackData.success,
      'Device DEV-A1B2C accepted in subsequent lecture session with zero collision'
    );

    // 13. Rejection: Duplicate Attendance Check
    console.log('\n[TEST 13] Validation Rule: Duplicate Attendance Rejection');
    const dupRes = await fetch(`${BASE_URL}/api/attendance/mark`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        studentIdentifier: '25215101',
        method: 'CARD',
        bypassWindow: true,
      }),
    });
    const dupData = await dupRes.json();
    assert(dupRes.status === 400 && dupData.code === 'DUPLICATE_ATTENDANCE', 'Duplicate attendance blocked');

    // 14. Timetable Matrix Query
    console.log('\n[TEST 14] Timetable Schedule Matrix');
    const ttRes = await fetch(`${BASE_URL}/api/timetable`);
    const ttData = await ttRes.json();
    assert(ttRes.status === 200 && ttData.timetable.length > 0, 'Retrieved active timetable matrix');

    // 15. Faculty Delegation Workflow
    console.log('\n[TEST 15] Faculty Delegation & Substitution Approval');
    const delReqRes = await fetch(`${BASE_URL}/api/delegation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: authCookie },
      body: JSON.stringify({
        timetableId: 'TT001',
        substituteFacultyId: 'FAC002',
        date: '2026-10-21',
        reason: 'University Accreditation Committee Meeting',
      }),
    });
    const delReqData = await delReqRes.json();
    assert(delReqRes.status === 200 && delReqData.success, 'Delegation request created');

    // Admin login
    const adminLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        loginId: 'ADM001',
        password: 'admin123',
        portalRole: 'ADMIN',
      }),
    });
    const adminLoginData = await adminLoginRes.json();
    assert(adminLoginRes.status === 200 && adminLoginData.user.role === 'ADMIN', 'Dean Admin authenticated');
    const adminCookie = adminLoginRes.headers.get('set-cookie');

    // 16. Student Attendance Reports (75% Defaulter Analytics)
    console.log('\n[TEST 16] Student Attendance Reports (75% Compliance)');
    const reportRes = await fetch(`${BASE_URL}/api/reports`, { headers: { Cookie: authCookie } });
    const reportData = await reportRes.json();
    assert(reportRes.status === 200 && reportData.success, 'Calculated subject attendance metrics');
    assert(reportData.totalStudents === 65, 'Analyzed all 65 seeded students');

    // 17. Offline Sync Reconciliation
    console.log('\n[TEST 17] Central Server Offline Queue Reconciliation');
    const flushRes = await fetch(`${BASE_URL}/api/sync`, { method: 'POST', headers: { Cookie: authCookie } });
    const flushData = await flushRes.json();
    assert(flushRes.status === 200 && flushData.success, 'Synchronized pending records to central backend');

    // 18. Close Session
    console.log('\n[TEST 18] Session Closure & Lock');
    const closeRes = await fetch(`${BASE_URL}/api/sessions/${sessionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: authCookie },
      body: JSON.stringify({ status: 'CLOSED' }),
    });
    const closeData = await closeRes.json();
    assert(closeRes.status === 200 && closeData.success, 'Lecture session closed');

    // Verify lockout after close
    const afterCloseRes = await fetch(`${BASE_URL}/api/attendance/mark`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        studentIdentifier: '25215105',
        method: 'CARD',
      }),
    });
    const afterCloseData = await afterCloseRes.json();
    assert(afterCloseRes.status === 400 && afterCloseData.code === 'SESSION_NOT_ACTIVE', 'Post-closure check-in rejected');

    // 19. Logout
    console.log('\n[TEST 19] Clean Session Logout');
    const logoutRes = await fetch(`${BASE_URL}/api/auth/logout`, { method: 'POST' });
    assert(logoutRes.status === 200, 'Logged out cleanly');

  } catch (error) {
    console.error('Fatal Test Exception:', error);
    failed++;
  }

  console.log('\n====================================================');
  console.log(`📊 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();

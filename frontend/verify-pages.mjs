// Automated Page and Component Verification Suite
const BASE_URL = 'http://localhost:3000';

async function verifyAll() {
  console.log('====================================================');
  console.log('🔍 Running Detailed Page & Feature Verification Suite');
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
    // 1. Verify Login Page
    console.log('[CHECK 1] Login Page Content & Credentials');
    const loginHtmlRes = await fetch(`${BASE_URL}/`);
    const loginHtml = await loginHtmlRes.text();
    assert(loginHtmlRes.status === 200, 'Login page returned HTTP 200');
    assert(loginHtml.includes('Prof. Sanjay Mehta (F002)') || loginHtml.includes('F002'), 'Prof. Sanjay Mehta credential pill is present');
    assert(loginHtml.includes('ADM001'), 'Dean Admin credential pill is present');

    // Authenticate as Dr. Anita Rao
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        loginId: 'F001',
        password: 'faculty123',
        portalRole: 'FACULTY',
      }),
    });
    const authCookie = loginRes.headers.get('set-cookie');
    assert(!!authCookie, 'Faculty F001 authenticated successfully');

    // 2. Verify Reports API and Data Consistency
    console.log('\n[CHECK 2] Reports Data Alignment & Student Stats');
    const reportsRes = await fetch(`${BASE_URL}/api/reports`, {
      headers: { Cookie: authCookie },
    });
    const reportsData = await reportsRes.json();
    assert(reportsRes.status === 200, 'Reports API returned HTTP 200');
    const studentList = reportsData.reports || reportsData.students;
    assert(Array.isArray(studentList), 'Students array returned');
    assert(studentList.length === 65, `Seeded students count is 65 (found: ${studentList?.length})`);

    // Verify stats counts
    let eligible = 0;
    let warning = 0;
    let critical = 0;
    let hasAttendedAndTotal = true;

    for (const s of studentList) {
      const pct = s.percentage !== undefined ? s.percentage : s.attendance_percentage;
      const attended = s.attended_count !== undefined ? s.attended_count : s.attended_sessions;
      const total = s.total_held !== undefined ? s.total_held : s.total_sessions;

      if (attended === undefined || total === undefined || pct === undefined) {
        hasAttendedAndTotal = false;
      }

      if (pct >= 75) eligible++;
      else if (pct >= 65) warning++;
      else critical++;
    }

    assert(hasAttendedAndTotal, 'All student records have valid attended, total, and percentage values');
    assert(eligible + warning + critical === 65, `All 65 students categorized into compliance tiers (Eligible: ${eligible}, Warning: ${warning}, Critical: ${critical})`);
    assert(critical > 0, `Critical shortfall students identified for Dean audit (${critical} students)`);

    // Sample student check
    const sample = studentList[0];
    console.log(`    Sample Student [${sample.student_id || sample.user_id}] ${sample.student_name || sample.name}: Attended ${sample.attended_count}/${sample.total_held} (${sample.percentage}%)`);
    assert(sample.attended_count !== undefined && sample.total_held > 0, 'Student data provides actual attended/total numbers');

    // 3. Verify Door Tap Simulator API
    console.log('\n[CHECK 3] Door Tap Simulator API (/api/attendance/simulate-door-taps)');

    // Create an active session to test simulator
    const sessRes = await fetch(`${BASE_URL}/api/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: authCookie },
      body: JSON.stringify({
        sessionType: 'MANUAL',
        subjectId: 'SUB001',
        classId: 'CLS001',
        classroomId: 'ROOM001',
      }),
    });
    const sessData = await sessRes.json();
    const sessionId = sessData.sessionId;

    // Simulate 85% Door Taps
    const simRes = await fetch(`${BASE_URL}/api/attendance/simulate-door-taps`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: authCookie },
      body: JSON.stringify({
        sessionId,
        mode: 'PARTIAL', // 85%
      }),
    });
    const simData = await simRes.json();
    assert(simRes.status === 200 && simData.success, 'Simulate 85% Door Taps succeeded');
    assert(simData.tappedCount > 0, `Successfully simulated ${simData.tappedCount} student door taps`);

    // Verify session pendingDoorTaps reflects simulation
    const sessDetailsRes = await fetch(`${BASE_URL}/api/sessions/${sessionId}`);
    const sessDetails = await sessDetailsRes.json();
    assert(sessDetails.pendingDoorTaps.length === simData.tappedCount, `Pending door taps ledger has ${sessDetails.pendingDoorTaps.length} students awaiting confirmation`);

    // Reset Door Taps
    const resetRes = await fetch(`${BASE_URL}/api/attendance/simulate-door-taps`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: authCookie },
      body: JSON.stringify({
        sessionId,
        mode: 'RESET',
      }),
    });
    const resetData = await resetRes.json();
    assert(resetRes.status === 200 && resetData.success, 'Reset Door Taps succeeded');

    const afterResetRes = await fetch(`${BASE_URL}/api/sessions/${sessionId}`);
    const afterReset = await afterResetRes.json();
    assert(afterReset.pendingDoorTaps.length === 0, 'Pending door taps ledger successfully reset to 0');

    // Close session
    await fetch(`${BASE_URL}/api/sessions/${sessionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: authCookie },
      body: JSON.stringify({ status: 'CLOSED' }),
    });

    // 4. Verify Timetable Search & Filter Functionality
    console.log('\n[CHECK 4] Timetable API & Matrix Filterability');
    const ttRes = await fetch(`${BASE_URL}/api/timetable`);
    const ttData = await ttRes.json();
    assert(ttRes.status === 200, 'Timetable API returned HTTP 200');
    const timetableList = ttData.timetable || ttData.entries || [];
    assert(Array.isArray(timetableList) && timetableList.length > 0, `Timetable entries retrieved (${timetableList.length} lectures)`);

    // Test search filter logic on timetable entries
    const searchFilterDrAnita = timetableList.filter(
      (e) => (e.faculty_name && e.faculty_name.toLowerCase().includes('anita')) || (e.subject_name && e.subject_name.toLowerCase().includes('anita'))
    );
    assert(searchFilterDrAnita.length > 0, `Search by "anita" successfully isolates Dr. Anita Rao's ${searchFilterDrAnita.length} lectures`);

    const searchFilterCS201 = timetableList.filter(
      (e) => (e.subject_code && e.subject_code.toLowerCase().includes('cs201')) || (e.subject_name && e.subject_name.toLowerCase().includes('data structures'))
    );
    assert(searchFilterCS201.length > 0, `Search by "cs201" successfully isolates ${searchFilterCS201.length} Data Structures lectures`);

    // 5. Verify Dean Admin Restrictions Logic
    console.log('\n[CHECK 5] Dean Admin Access Restrictions');
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
    assert(adminLoginRes.status === 200 && adminLoginData.user.role === 'ADMIN', 'Dean Admin authenticated as ADMIN');

    // Attempting to create an ad-hoc attendance session as admin should be blocked
    const adminCookie = adminLoginRes.headers.get('set-cookie');
    const adminCreateRes = await fetch(`${BASE_URL}/api/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({
        sessionType: 'MANUAL',
        subjectId: 'SUB001',
        classId: 'CLS001',
        classroomId: 'ROOM001',
      }),
    });
    assert(adminCreateRes.status === 403, 'Dean Admin is strictly blocked (HTTP 403) from creating live attendance sessions');

    console.log('\n====================================================');
    console.log(`🎯 VERIFICATION RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================');
  } catch (err) {
    console.error('Test execution error:', err);
  }
}

verifyAll();

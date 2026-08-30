package com.smartattendance.attendance;

import com.smartattendance.attendance.testsupport.*;
import com.smartattendance.exceptions.*;
import com.smartattendance.model.*;

import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;

/**
 * Lightweight, dependency-free test harness (no JUnit needed - this
 * environment has no internet access to fetch it from Maven Central).
 * Swap this for real JUnit 5 @Test methods once the team's build can reach
 * Maven Central; the assertions below map 1:1 onto JUnit assertions.
 *
 * Run with:  java -cp target/classes:target/test-classes com.smartattendance.attendance.AttendanceServiceTest
 */
public class AttendanceServiceTest {

    private static int passed = 0;
    private static int failed = 0;

    public static void main(String[] args) {
        testOnTimeAttendanceIsMarkedPresent();
        testLateAttendanceIsMarkedLate();
        testDuplicateAttendanceIsRejected();
        testUnenrolledStudentIsRejected();
        testOutsideWindowIsRejected();
        testManualSessionRequiresFaculty();
        testFacultySubstitutionAndAuthorization();
        testCloseSessionBlocksFurtherMarking();
        testAttendanceReportCounts();
        testAutomaticSessionResolvesFromTimetable();

        System.out.println();
        System.out.println("==========================================");
        System.out.println("RESULTS: " + passed + " passed, " + failed + " failed");
        System.out.println("==========================================");
        if (failed > 0) {
            System.exit(1);
        }
    }

    // ------------------------------------------------------------------
    // Fixture builder
    // ------------------------------------------------------------------

    private static class Fixture {
        private final AttendanceService service;
        private final InMemoryAttendanceSessionRepository sessionRepo;
        private final InMemoryAttendanceRecordRepository recordRepo;
        private final InMemoryStudentRepository studentRepo;
        private final InMemoryTimetableRepository timetableRepo;

        Fixture(AttendanceService service, InMemoryAttendanceSessionRepository sessionRepo,
                InMemoryAttendanceRecordRepository recordRepo, InMemoryStudentRepository studentRepo,
                InMemoryTimetableRepository timetableRepo) {
            this.service = service;
            this.sessionRepo = sessionRepo;
            this.recordRepo = recordRepo;
            this.studentRepo = studentRepo;
            this.timetableRepo = timetableRepo;
        }

        AttendanceService service() { return service; }
        InMemoryAttendanceSessionRepository sessionRepo() { return sessionRepo; }
        InMemoryAttendanceRecordRepository recordRepo() { return recordRepo; }
        InMemoryStudentRepository studentRepo() { return studentRepo; }
        InMemoryTimetableRepository timetableRepo() { return timetableRepo; }
    }

    private static Fixture buildFixture() {
        var studentRepo = new InMemoryStudentRepository();
        var timetableRepo = new InMemoryTimetableRepository();
        var sessionRepo = new InMemoryAttendanceSessionRepository();
        var recordRepo = new InMemoryAttendanceRecordRepository();

        var windowConfig = AttendanceWindowConfig.defaultConfig(); // 5 / 5 / 15
        var validator = new DefaultAttendanceValidator(studentRepo, recordRepo, windowConfig);
        var timetableService = new TimetableService(timetableRepo);
        var reportService = new AttendanceReportService(recordRepo);

        var service = new AttendanceService(timetableService, validator, sessionRepo, recordRepo, studentRepo, reportService);

        studentRepo.add(new Student("S001", "Asha Verma", "BCA2A"));
        studentRepo.add(new Student("S002", "Ravi Kumar", "BCA2A"));
        studentRepo.add(new Student("S003", "Neha Singh", "BCA2B")); // different class

        return new Fixture(service, sessionRepo, recordRepo, studentRepo, timetableRepo);
    }

    private static AttendanceSession activeSession(Fixture fx, LocalDateTime start, LocalDateTime end) {
        var session = new AttendanceSession("SESSION-TEST", "SUBJ-JAVA", "BCA2A", "A204",
                "F001", start, end, SessionType.MANUAL);
        session.setStatus(SessionStatus.ACTIVE);
        fx.sessionRepo().save(session);
        return session;
    }

    // ------------------------------------------------------------------
    // Tests
    // ------------------------------------------------------------------

    private static void testOnTimeAttendanceIsMarkedPresent() {
        var fx = buildFixture();
        var start = LocalDateTime.of(2026, 8, 31, 10, 0);
        var session = activeSession(fx, start, start.plusHours(1));
        var student = requireStudent(fx, "S001");

        try {
            var record = fx.service().markAttendance(student, session, "FACE", start.plusMinutes(2));
            assertEquals("testOnTimeAttendanceIsMarkedPresent", AttendanceStatus.PRESENT, record.getStatus());
            System.out.println("Sample output -> " + record);
        } catch (AttendanceException e) {
            fail("testOnTimeAttendanceIsMarkedPresent", "unexpected exception: " + e.getMessage());
        }
    }

    private static void testLateAttendanceIsMarkedLate() {
        var fx = buildFixture();
        var start = LocalDateTime.of(2026, 8, 31, 10, 0);
        var session = activeSession(fx, start, start.plusHours(1));
        var student = requireStudent(fx, "S001");

        try {
            // 10 minutes in: past the 5-minute on-time window, still inside the 15-minute late window
            var record = fx.service().markAttendance(student, session, "RFID", start.plusMinutes(10));
            assertEquals("testLateAttendanceIsMarkedLate", AttendanceStatus.LATE, record.getStatus());
            System.out.println("Sample output -> " + record);
        } catch (AttendanceException e) {
            fail("testLateAttendanceIsMarkedLate", "unexpected exception: " + e.getMessage());
        }
    }

    private static void testDuplicateAttendanceIsRejected() {
        var fx = buildFixture();
        var start = LocalDateTime.of(2026, 8, 31, 10, 0);
        var session = activeSession(fx, start, start.plusHours(1));
        var student = requireStudent(fx, "S001");

        try {
            fx.service().markAttendance(student, session, "FACE", start.plusMinutes(1));
            fx.service().markAttendance(student, session, "FACE", start.plusMinutes(2));
            fail("testDuplicateAttendanceIsRejected", "expected DuplicateAttendanceException, none thrown");
        } catch (DuplicateAttendanceException e) {
            pass("testDuplicateAttendanceIsRejected");
        } catch (AttendanceException e) {
            fail("testDuplicateAttendanceIsRejected", "wrong exception type: " + e.getClass().getSimpleName());
        }
    }

    private static void testUnenrolledStudentIsRejected() {
        var fx = buildFixture();
        var start = LocalDateTime.of(2026, 8, 31, 10, 0);
        var session = activeSession(fx, start, start.plusHours(1)); // session is for BCA2A
        var student = requireStudent(fx, "S003"); // enrolled in BCA2B

        try {
            fx.service().markAttendance(student, session, "FACE", start.plusMinutes(1));
            fail("testUnenrolledStudentIsRejected", "expected StudentNotEnrolledException, none thrown");
        } catch (StudentNotEnrolledException e) {
            pass("testUnenrolledStudentIsRejected");
        } catch (AttendanceException e) {
            fail("testUnenrolledStudentIsRejected", "wrong exception type: " + e.getClass().getSimpleName());
        }
    }

    private static void testOutsideWindowIsRejected() {
        var fx = buildFixture();
        var start = LocalDateTime.of(2026, 8, 31, 10, 0);
        var session = activeSession(fx, start, start.plusHours(1));
        var student = requireStudent(fx, "S001");

        try {
            // 20 minutes in: past the 15-minute late cutoff
            fx.service().markAttendance(student, session, "FACE", start.plusMinutes(20));
            fail("testOutsideWindowIsRejected", "expected AttendanceWindowClosedException, none thrown");
        } catch (AttendanceWindowClosedException e) {
            pass("testOutsideWindowIsRejected");
        } catch (AttendanceException e) {
            fail("testOutsideWindowIsRejected", "wrong exception type: " + e.getClass().getSimpleName());
        }
    }

    private static void testManualSessionRequiresFaculty() {
        var fx = buildFixture();
        var start = LocalDateTime.of(2026, 8, 31, 14, 0);

        try {
            var session = fx.service().startManualSession("SUBJ-DSA", "BCA2A", "A205", "F002",
                    start, start.plusHours(1));
            assertEquals("testManualSessionRequiresFaculty", SessionStatus.ACTIVE, session.getStatus());
            System.out.println("Sample output -> " + session);
        } catch (UnauthorizedFacultyException e) {
            fail("testManualSessionRequiresFaculty", "unexpected exception: " + e.getMessage());
        }

        try {
            fx.service().startManualSession("SUBJ-DSA", "BCA2A", "A205", "  ", start, start.plusHours(1));
            fail("testManualSessionRequiresFaculty (blank id)", "expected UnauthorizedFacultyException, none thrown");
        } catch (UnauthorizedFacultyException e) {
            pass("testManualSessionRequiresFaculty (blank id)");
        }
    }

    private static void testFacultySubstitutionAndAuthorization() {
        var fx = buildFixture();
        var start = LocalDateTime.of(2026, 8, 31, 10, 0);
        var session = activeSession(fx, start, start.plusHours(1)); // scheduled faculty F001

        try {
            fx.service().updateActualFaculty(session.getId(), "F999", "F001"); // F001 is authorized (scheduled)
            var updated = fx.sessionRepo().findById(session.getId()).orElseThrow();
            assertEquals("testFacultySubstitutionAndAuthorization", "F999", updated.getActualFacultyId());
            System.out.println("Sample output -> " + updated);
        } catch (AttendanceException e) {
            fail("testFacultySubstitutionAndAuthorization", "unexpected exception: " + e.getMessage());
        }

        try {
            fx.service().updateActualFaculty(session.getId(), "F888", "F_INTRUDER");
            fail("testFacultySubstitutionAndAuthorization (unauthorized)", "expected UnauthorizedFacultyException");
        } catch (UnauthorizedFacultyException e) {
            pass("testFacultySubstitutionAndAuthorization (unauthorized)");
        } catch (InvalidSessionException e) {
            fail("testFacultySubstitutionAndAuthorization (unauthorized)", "wrong exception: " + e.getMessage());
        }
    }

    private static void testCloseSessionBlocksFurtherMarking() {
        var fx = buildFixture();
        var start = LocalDateTime.of(2026, 8, 31, 10, 0);
        var session = activeSession(fx, start, start.plusHours(1));
        var student = requireStudent(fx, "S001");

        try {
            fx.service().closeSession(session.getId(), "F001");
            fx.service().markAttendance(student, session, "FACE", start.plusMinutes(1));
            fail("testCloseSessionBlocksFurtherMarking", "expected InvalidSessionException, none thrown");
        } catch (InvalidSessionException e) {
            pass("testCloseSessionBlocksFurtherMarking");
        } catch (AttendanceException e) {
            fail("testCloseSessionBlocksFurtherMarking", "wrong exception type: " + e.getClass().getSimpleName());
        }
    }

    private static void testAttendanceReportCounts() {
        var fx = buildFixture();
        var start = LocalDateTime.of(2026, 8, 31, 10, 0);
        var session = activeSession(fx, start, start.plusHours(1));
        var s1 = requireStudent(fx, "S001");
        var s2 = requireStudent(fx, "S002");

        try {
            fx.service().markAttendance(s1, session, "FACE", start.plusMinutes(1));  // PRESENT
            fx.service().markAttendance(s2, session, "FACE", start.plusMinutes(10)); // LATE

            Map<String, Object> summary = fx.service().getAttendanceSummary(session.getId());
            assertEquals("testAttendanceReportCounts (present)", 1L, summary.get("present"));
            assertEquals("testAttendanceReportCounts (late)", 1L, summary.get("late"));
            System.out.println("Sample output -> " + summary);
        } catch (AttendanceException e) {
            fail("testAttendanceReportCounts", "unexpected exception: " + e.getMessage());
        }
    }

    private static void testAutomaticSessionResolvesFromTimetable() {
        var fx = buildFixture();
        fx.timetableRepo().add(new TimetableSlot("TT001", "SUBJ-JAVA", "BCA2A", "A204", "F001",
                DayOfWeek.MONDAY, LocalTime.of(10, 0), LocalTime.of(11, 0)));

        var monday10 = LocalDateTime.of(2026, 8, 31, 10, 5); // 2026-08-31 is a Monday
        try {
            var session = fx.service().startAutomaticSession("F001", "A204", monday10);
            assertEquals("testAutomaticSessionResolvesFromTimetable", "SUBJ-JAVA", session.getSubjectId());
            System.out.println("Sample output -> " + session);
        } catch (InvalidSessionException e) {
            fail("testAutomaticSessionResolvesFromTimetable", "unexpected exception: " + e.getMessage());
        }
    }

    // ------------------------------------------------------------------
    // Tiny assertion helpers
    // ------------------------------------------------------------------

    private static void assertEquals(String testName, Object expected, Object actual) {
        if (expected == null ? actual == null : expected.equals(actual)) {
            pass(testName);
        } else {
            fail(testName, "expected <" + expected + "> but was <" + actual + ">");
        }
    }

    private static Student requireStudent(Fixture fixture, String studentId) {
        Student student = fixture.studentRepo().findById(studentId);
        if (student == null) {
            throw new IllegalStateException("Missing test student " + studentId);
        }
        return student;
    }

    private static void pass(String testName) {
        passed++;
        System.out.println("[PASS] " + testName);
    }

    private static void fail(String testName, String reason) {
        failed++;
        System.out.println("[FAIL] " + testName + " - " + reason);
    }
}

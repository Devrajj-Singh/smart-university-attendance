package com.smartattendance;

import com.smartattendance.attendance.AttendanceReportService;
import com.smartattendance.attendance.AttendanceService;
import com.smartattendance.attendance.AttendanceWindowConfig;
import com.smartattendance.attendance.DefaultAttendanceValidator;
import com.smartattendance.attendance.TimetableService;
import com.smartattendance.attendance.testsupport.InMemoryAttendanceRecordRepository;
import com.smartattendance.attendance.testsupport.InMemoryAttendanceRepository;
import com.smartattendance.attendance.testsupport.InMemoryAttendanceSessionRepository;
import com.smartattendance.attendance.testsupport.InMemoryStudentRepository;
import com.smartattendance.attendance.testsupport.InMemoryTimetableRepository;
import com.smartattendance.authentication.AuthenticationResult;
import com.smartattendance.authentication.IDCardAuthentication;
import com.smartattendance.authentication.IrisAuthentication;
import com.smartattendance.dashboard.FacultyDelegationService;
import com.smartattendance.exceptions.AttendanceWindowClosedException;
import com.smartattendance.exceptions.DuplicateAttendanceException;
import com.smartattendance.exceptions.StudentNotEnrolledException;
import com.smartattendance.exceptions.UnauthorizedFacultyException;
import com.smartattendance.model.AttendanceRecord;
import com.smartattendance.model.AttendanceSession;
import com.smartattendance.model.AttendanceStatus;
import com.smartattendance.model.BiometricDevice;
import com.smartattendance.model.SessionStatus;
import com.smartattendance.model.SessionType;
import com.smartattendance.model.Student;
import com.smartattendance.model.TimetableSlot;
import com.smartattendance.sync.SyncRecord;
import com.smartattendance.sync.SyncService;
import com.smartattendance.sync.UniversityAttendanceBackend;
import org.junit.jupiter.api.Test;

import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.time.LocalTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class IntegratedSystemTest {

    @Test
    void recordsValidAttendanceAndRejectsDuplicate() throws Exception {
        Fixture fixture = fixture();
        AttendanceSession session = activeSession(fixture);
        Student student = fixture.students.findById("25215101");

        AttendanceRecord record = fixture.service.markAttendance(student, session, "ID_CARD", session.getStartTime().plusMinutes(2));

        assertEquals(AttendanceStatus.PRESENT, record.getStatus());
        assertThrows(DuplicateAttendanceException.class,
                () -> fixture.service.markAttendance(student, session, "ID_CARD", session.getStartTime().plusMinutes(3)));
    }

    @Test
    void rejectsOutsideWindowAndWrongClassStudent() {
        Fixture fixture = fixture();
        AttendanceSession session = activeSession(fixture);

        assertThrows(AttendanceWindowClosedException.class,
                () -> fixture.service.markAttendance(fixture.students.findById("25215101"), session, "IRIS",
                        session.getStartTime().plusMinutes(30)));
        assertThrows(StudentNotEnrolledException.class,
                () -> fixture.service.markAttendance(fixture.students.findById("25215136"), session, "IRIS",
                        session.getStartTime().plusMinutes(2)));
    }

    @Test
    void authorizesScheduledFacultyAndDelegatedFaculty() throws Exception {
        Fixture fixture = fixture();
        AttendanceSession session = activeSession(fixture);

        fixture.service.updateActualFaculty(session.getId(), "FAC002", "FAC001");
        assertEquals("FAC002", fixture.sessions.findById(session.getId()).orElseThrow().getActualFacultyId());

        assertThrows(UnauthorizedFacultyException.class,
                () -> fixture.service.closeSession(session.getId(), "FAC999"));
        fixture.service.closeSession(session.getId(), "FAC002");
        assertEquals(SessionStatus.CLOSED, fixture.sessions.findById(session.getId()).orElseThrow().getStatus());

        FacultyDelegationService delegationService = new FacultyDelegationService();
        assertTrue(delegationService.assignAlternateFaculty(session.getId(), "FAC001", "FAC002"));
        assertTrue(delegationService.isAuthorizedFaculty(session.getId(), "FAC002"));
    }

    @Test
    void authenticatesCardAndSimulatedIrisByRegistrationNumber() throws Exception {
        Student student = new Student("25215101", "Demo Student", "demo@student.edu",
                "CARD-25215101", "IRIS-25215101", "CLS001");
        BiometricDevice device = new BiometricDevice("DEV1", "ROOM001", "CARD_AND_IRIS",
                BiometricDevice.DeviceStatus.ONLINE, LocalDateTime.now());

        IDCardAuthentication card = new IDCardAuthentication();
        card.registerCard(student.getRegistrationNumber(), student.getCardUid());
        AuthenticationResult cardResult = card.authenticate(student, "CARD-25215101", device);
        assertEquals(AuthenticationResult.Status.SUCCESS, cardResult.getStatus());

        IrisAuthentication iris = new IrisAuthentication();
        iris.registerBiometric(student.getRegistrationNumber(), student.getBiometricId());
        AuthenticationResult irisResult = iris.authenticate(student, "IRIS-25215101", device);
        assertEquals(AuthenticationResult.Status.SUCCESS, irisResult.getStatus());
    }

    @Test
    void synchronizesPendingRecordOnlyOnce() {
        InMemoryAttendanceRepository repository = new InMemoryAttendanceRepository();
        UniversityAttendanceBackend backend = new UniversityAttendanceBackend();
        SyncService syncService = new SyncService(repository, backend);
        AttendanceRecord record = new AttendanceRecord("REC1", "SESSION1", "25215101",
                LocalDateTime.now(), AttendanceRecord.AuthMethod.CARD, AttendanceStatus.PRESENT, false);
        repository.add(record);

        SyncRecord syncRecord = syncService.enqueue("REC1");
        syncService.triggerSync();
        syncService.triggerSync();

        assertEquals(SyncRecord.Status.SYNCED, syncRecord.getStatus());
        assertTrue(record.isSynced());
        assertEquals(0, syncService.getPendingCount());
    }

    @Test
    void resolvesAutomaticSessionFromTimetableAndRegistrationLookup() throws Exception {
        Fixture fixture = fixture();
        fixture.timetable.add(new TimetableSlot("TT1", "SUB001", "CLS001", "ROOM001", "FAC001",
                DayOfWeek.MONDAY, LocalTime.of(10, 0), LocalTime.of(11, 0)));

        AttendanceSession session = fixture.service.startAutomaticSession("FAC001", "ROOM001",
                LocalDateTime.of(2026, 8, 31, 10, 10));

        assertEquals(SessionType.AUTOMATIC, session.getSessionType());
        assertEquals("25215101", fixture.students.findById("25215101").getRegistrationNumber());
    }

    private static Fixture fixture() {
        InMemoryStudentRepository students = new InMemoryStudentRepository();
        students.add(new Student("25215101", "Student One", "one@student.edu", "CARD-25215101", "IRIS-25215101", "CLS001"));
        students.add(new Student("25215136", "Student Other", "other@student.edu", "CARD-25215136", "IRIS-25215136", "CLS002"));

        InMemoryTimetableRepository timetable = new InMemoryTimetableRepository();
        InMemoryAttendanceSessionRepository sessions = new InMemoryAttendanceSessionRepository();
        InMemoryAttendanceRecordRepository records = new InMemoryAttendanceRecordRepository();
        AttendanceService service = new AttendanceService(
                new TimetableService(timetable),
                new DefaultAttendanceValidator(students, records, AttendanceWindowConfig.defaultConfig()),
                sessions,
                records,
                students,
                new AttendanceReportService(records));
        return new Fixture(service, students, timetable, sessions);
    }

    private static AttendanceSession activeSession(Fixture fixture) {
        LocalDateTime start = LocalDateTime.of(2026, 8, 31, 10, 0);
        AttendanceSession session = new AttendanceSession("SESSION1", "SUB001", "CLS001", "ROOM001",
                "FAC001", start, start.plusHours(1), SessionType.MANUAL);
        session.setStatus(SessionStatus.ACTIVE);
        fixture.sessions.save(session);
        return session;
    }

    private static class Fixture {
        final AttendanceService service;
        final InMemoryStudentRepository students;
        final InMemoryTimetableRepository timetable;
        final InMemoryAttendanceSessionRepository sessions;

        Fixture(AttendanceService service, InMemoryStudentRepository students,
                InMemoryTimetableRepository timetable, InMemoryAttendanceSessionRepository sessions) {
            this.service = service;
            this.students = students;
            this.timetable = timetable;
            this.sessions = sessions;
        }
    }
}

package com.smartattendance.attendance;

import com.smartattendance.database.repository.AttendanceRecordRepository;
import com.smartattendance.database.repository.AttendanceSessionRepository;
import com.smartattendance.database.repository.StudentRepository;
import com.smartattendance.database.repository.TimetableRepository;
import com.smartattendance.exceptions.*;
import com.smartattendance.model.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Central attendance engine. Implements both integration-contract
 * interfaces so each calling module only ever sees the slice it needs
 * (interface segregation): Teammate 3 codes against
 * StudentAttendanceOperations, Teammate 4 against
 * FacultyDashboardOperations, and neither has to know the other exists,
 * or that a database module exists at all.
 */
public class AttendanceService implements StudentAttendanceOperations, FacultyDashboardOperations {

    private final TimetableService timetableService;
    private final AttendanceValidator validator;
    private final AttendanceSessionRepository sessionRepository;
    private final AttendanceRecordRepository recordRepository;
    private final StudentRepository studentRepository;
    private final AttendanceReportService reportService;

    public AttendanceService() {
        this(new TimetableRepository(), new AttendanceSessionRepository(), new AttendanceRecordRepository(), new StudentRepository());
    }

    private AttendanceService(TimetableRepository timetableRepository,
                              AttendanceSessionRepository sessionRepository,
                              AttendanceRecordRepository recordRepository,
                              StudentRepository studentRepository) {
        this(new TimetableService(timetableRepository),
                new DefaultAttendanceValidator(studentRepository, recordRepository, AttendanceWindowConfig.defaultConfig()),
                sessionRepository,
                recordRepository,
                studentRepository,
                new AttendanceReportService(recordRepository));
    }

    public AttendanceService(TimetableService timetableService,
                              AttendanceValidator validator,
                              AttendanceSessionRepository sessionRepository,
                              AttendanceRecordRepository recordRepository,
                              StudentRepository studentRepository,
                              AttendanceReportService reportService) {
        this.timetableService = timetableService;
        this.validator = validator;
        this.sessionRepository = sessionRepository;
        this.recordRepository = recordRepository;
        this.studentRepository = studentRepository;
        this.reportService = reportService;
    }

    // ------------------------------------------------------------------
    // Session creation
    // ------------------------------------------------------------------

    @Override
    public AttendanceSession startAutomaticSession(String facultyId, String classroomId, LocalDateTime currentDateTime)
            throws InvalidSessionException {

        TimetableSlot slot = timetableService.resolveAutomaticSlot(facultyId, classroomId, currentDateTime);

        var sessionStart = LocalDateTime.of(currentDateTime.toLocalDate(), slot.getStartTime());
        var sessionEnd = LocalDateTime.of(currentDateTime.toLocalDate(), slot.getEndTime());

        AttendanceSession session = new AttendanceSession(
                newId("SESSION"), slot.getSubjectId(), slot.getClassId(), slot.getClassroomId(),
                slot.getFacultyId(), sessionStart, sessionEnd, SessionType.AUTOMATIC);

        return activateAndSave(session);
    }

    @Override
    public AttendanceSession startManualSession(String subjectId, String classId, String classroomId, String facultyId,
                                                  LocalDateTime startTime, LocalDateTime endTime)
            throws UnauthorizedFacultyException {

        validator.validateFacultyAuthorization(facultyId, "start manual session");

        AttendanceSession session = new AttendanceSession(
                newId("SESSION"), subjectId, classId, classroomId, facultyId, startTime, endTime, SessionType.MANUAL);

        return activateAndSave(session);
    }

    private AttendanceSession activateAndSave(AttendanceSession session) {
        session.setStatus(SessionStatus.ACTIVE);
        return sessionRepository.save(session);
    }

    // ------------------------------------------------------------------
    // Attendance marking  (Teammate 3 entry points)
    // ------------------------------------------------------------------

    @Override
    public AttendanceRecord processAuthenticatedStudent(Student student, AttendanceSession session, String authenticationMethod)
            throws StudentNotEnrolledException, InvalidSessionException, AttendanceWindowClosedException,
                   DuplicateAttendanceException {

        var now = LocalDateTime.now();
        return markAttendance(student, session, authenticationMethod, now);
    }

    /** Overload: mark attendance by id instead of already-loaded objects. */
    public AttendanceRecord markAttendance(String studentId, String sessionId, String authenticationMethod)
            throws StudentNotEnrolledException, InvalidSessionException, AttendanceWindowClosedException,
                   DuplicateAttendanceException {

        Student student = validator.validateStudentExists(studentId);
        AttendanceSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new InvalidSessionException(sessionId, "session does not exist"));

        return markAttendance(student, session, authenticationMethod, LocalDateTime.now());
    }

    public AttendanceRecord recordAttendance(String sessionId, String studentId, String authenticationMethod)
            throws AttendanceException {
        return markAttendance(studentId, sessionId, authenticationMethod);
    }

    public AttendanceRecord recordAttendance(Student student, AttendanceSession session) throws AttendanceException {
        return markAttendance(student, session, "AUTHENTICATED", LocalDateTime.now());
    }

    /** Overload: mark attendance with an explicit timestamp (useful for tests / backfilling). */
    public AttendanceRecord markAttendance(Student student, AttendanceSession session, String authenticationMethod,
                                            LocalDateTime attemptTime)
            throws StudentNotEnrolledException, InvalidSessionException, AttendanceWindowClosedException,
                   DuplicateAttendanceException {

        validator.validateEnrollment(student, session);
        validator.validateSessionActive(session);
        validator.validateWithinWindow(session, attemptTime);
        validator.validateNotDuplicate(student.getId(), session.getId());

        AttendanceStatus status = validator.isOnTime(session, attemptTime)
                ? AttendanceStatus.PRESENT
                : AttendanceStatus.LATE;

        AttendanceRecord record = new AttendanceRecord(
                newId("RECORD"), student.getId(), session.getId(), attemptTime, status, authenticationMethod);

        return recordRepository.save(record);
    }

    @Override
    public AttendanceSession getActiveSession(String classroomId) throws InvalidSessionException {
        List<AttendanceSession> active = sessionRepository.findActiveByClassroom(classroomId);
        if (active.isEmpty()) {
            throw new InvalidSessionException("No active session found in classroom '" + classroomId + "'");
        }
        return active.get(0);
    }

    @Override
    public void validateStudentForSession(String studentId, String sessionId)
            throws StudentNotEnrolledException, InvalidSessionException {

        Student student = validator.validateStudentExists(studentId);
        AttendanceSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new InvalidSessionException(sessionId, "session does not exist"));

        validator.validateEnrollment(student, session);
        validator.validateSessionActive(session);
    }

    // ------------------------------------------------------------------
    // Dashboard / faculty operations  (Teammate 4 entry points)
    // ------------------------------------------------------------------

    @Override
    public List<TimetableSlot> getTodaysClasses(String classId, LocalDateTime today) {
        return timetableService.getSlotsForClass(classId).stream()
                .filter(slot -> slot.getDayOfWeek() == today.getDayOfWeek())
                .collect(Collectors.toList());
    }

    @Override
    public Map<String, Object> getAttendanceSummary(String sessionId) throws InvalidSessionException {
        return reportService.buildSessionSummary(sessionId);
    }

    @Override
    public void updateActualFaculty(String sessionId, String newFacultyId, String requestingFacultyId)
            throws InvalidSessionException, UnauthorizedFacultyException {

        AttendanceSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new InvalidSessionException(sessionId, "session does not exist"));

        validator.validateFacultyAuthorization(requestingFacultyId, session);

        session.setActualFacultyId(newFacultyId);
        sessionRepository.update(session);
    }

    @Override
    public void closeSession(String sessionId, String requestingFacultyId)
            throws InvalidSessionException, UnauthorizedFacultyException {

        AttendanceSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new InvalidSessionException(sessionId, "session does not exist"));

        validator.validateFacultyAuthorization(requestingFacultyId, session);

        session.setStatus(SessionStatus.CLOSED);
        sessionRepository.update(session);
    }

    public List<AttendanceSession> getTodaysSessionsForFaculty(String facultyId) {
        return sessionRepository.findByFaculty(facultyId).stream()
                .filter(session -> session.getStartTime() != null)
                .filter(session -> session.getStartTime().toLocalDate().equals(LocalDateTime.now().toLocalDate()))
                .collect(Collectors.toList());
    }

    public List<String> getSessionAttendanceRecords(String sessionId) {
        return recordRepository.findBySession(sessionId).stream()
                .map(record -> record.getStudentId() + " | " + record.getStatus() + " | " + record.getTimestamp())
                .collect(Collectors.toList());
    }

    // ------------------------------------------------------------------

    private static String newId(String prefix) {
        return prefix + "-" + UUID.randomUUID().toString().substring(0, 8);
    }
}

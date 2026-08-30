package com.smartattendance.attendance;

import com.smartattendance.database.repository.AttendanceRecordRepository;
import com.smartattendance.database.repository.StudentRepository;
import com.smartattendance.exceptions.*;
import com.smartattendance.model.AttendanceSession;
import com.smartattendance.model.SessionStatus;
import com.smartattendance.model.Student;

import java.time.Duration;
import java.time.LocalDateTime;

/**
 * Default, straightforward implementation of AttendanceValidator.
 * Runs the checks from the VALIDATION section of the spec, in order,
 * each raising its own specific exception so callers can react precisely.
 */
public class DefaultAttendanceValidator implements AttendanceValidator {

    private final StudentRepository studentRepository;
    private final AttendanceRecordRepository attendanceRecordRepository;
    private final AttendanceWindowConfig windowConfig;

    public DefaultAttendanceValidator(StudentRepository studentRepository,
                                       AttendanceRecordRepository attendanceRecordRepository,
                                       AttendanceWindowConfig windowConfig) {
        this.studentRepository = studentRepository;
        this.attendanceRecordRepository = attendanceRecordRepository;
        this.windowConfig = windowConfig;
    }

    @Override
    public Student validateStudentExists(String studentId) throws StudentNotEnrolledException {
        Student student = studentRepository.findById(studentId);
        if (student == null) {
            throw new StudentNotEnrolledException(studentId, "UNKNOWN");
        }
        return student;
    }

    @Override
    public void validateEnrollment(Student student, AttendanceSession session) throws StudentNotEnrolledException {
        if (!studentRepository.isEnrolledInClass(student.getId(), session.getClassId())) {
            throw new StudentNotEnrolledException(student.getId(), session.getClassId());
        }
    }

    @Override
    public void validateSessionActive(AttendanceSession session) throws InvalidSessionException {
        if (session == null) {
            throw new InvalidSessionException("Session does not exist");
        }
        if (session.getStatus() != SessionStatus.ACTIVE) {
            throw new InvalidSessionException(session.getId(), "session is " + session.getStatus() + ", not ACTIVE");
        }
    }

    @Override
    public void validateWithinWindow(AttendanceSession session, LocalDateTime attemptTime)
            throws AttendanceWindowClosedException {
        LocalDateTime windowOpen = session.getStartTime().minusMinutes(windowConfig.getOpenBeforeMinutes());
        LocalDateTime windowClose = session.getStartTime().plusMinutes(windowConfig.getLateMinutes());

        if (attemptTime.isBefore(windowOpen) || attemptTime.isAfter(windowClose)) {
            throw new AttendanceWindowClosedException(session.getId(), attemptTime);
        }
    }

    @Override
    public void validateClassroom(AttendanceSession session, String classroomId) throws InvalidClassroomException {
        if (!session.getClassroomId().equals(classroomId)) {
            throw new InvalidClassroomException(classroomId, session.getId());
        }
    }

    @Override
    public void validateNotDuplicate(String studentId, String sessionId) throws DuplicateAttendanceException {
        if (attendanceRecordRepository.existsByStudentAndSession(studentId, sessionId)) {
            throw new DuplicateAttendanceException(studentId, sessionId);
        }
    }

    @Override
    public void validateFacultyAuthorization(String facultyId, AttendanceSession session)
            throws UnauthorizedFacultyException {
        boolean isActualFaculty = session.getActualFacultyId() != null
                && session.getActualFacultyId().equals(facultyId);
        boolean isScheduledFaculty = session.getScheduledFacultyId() != null
                && session.getScheduledFacultyId().equals(facultyId);

        if (!isActualFaculty && !isScheduledFaculty) {
            throw new UnauthorizedFacultyException(facultyId, "manage session '" + session.getId() + "'");
        }
    }

    @Override
    public void validateFacultyAuthorization(String facultyId, String operation) throws UnauthorizedFacultyException {
        if (facultyId == null || facultyId.isBlank()) {
            throw new UnauthorizedFacultyException(String.valueOf(facultyId), operation);
        }
    }

    /** Computes whether an attempt time falls in the PRESENT window, exposed for AttendanceService. */
    @Override
    public boolean isOnTime(AttendanceSession session, LocalDateTime attemptTime) {
        Duration elapsed = Duration.between(session.getStartTime(), attemptTime);
        return !elapsed.isNegative() && elapsed.toMinutes() <= windowConfig.getOnTimeMinutes();
    }
}

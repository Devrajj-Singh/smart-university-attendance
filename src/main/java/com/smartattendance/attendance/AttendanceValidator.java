package com.smartattendance.attendance;

import com.smartattendance.exceptions.*;
import com.smartattendance.model.AttendanceSession;
import com.smartattendance.model.Student;

import java.time.LocalDateTime;

/**
 * Abstraction over "is this attendance mark allowed?". Expressed as an
 * interface (rather than a concrete class) so the validation ruleset can be
 * swapped or extended later (e.g. a stricter FinalExamValidator) without
 * touching AttendanceService — classic dependency-on-abstraction.
 */
public interface AttendanceValidator {

    Student validateStudentExists(String studentId) throws StudentNotEnrolledException;

    void validateEnrollment(Student student, AttendanceSession session) throws StudentNotEnrolledException;

    void validateSessionActive(AttendanceSession session) throws InvalidSessionException;

    void validateWithinWindow(AttendanceSession session, LocalDateTime attemptTime)
            throws AttendanceWindowClosedException;

    void validateClassroom(AttendanceSession session, String classroomId) throws InvalidClassroomException;

    void validateNotDuplicate(String studentId, String sessionId) throws DuplicateAttendanceException;

    /** Overload: authorize by faculty id against a specific session (e.g. before closing it). */
    void validateFacultyAuthorization(String facultyId, AttendanceSession session)
            throws UnauthorizedFacultyException;

    /** Overload: authorize a faculty id generically for a manual-session action (e.g. starting one). */
    void validateFacultyAuthorization(String facultyId, String operation) throws UnauthorizedFacultyException;

    /** True if attemptTime still falls inside the "on time" (PRESENT) portion of the window, false if it's in the LATE portion. */
    boolean isOnTime(AttendanceSession session, LocalDateTime attemptTime);
}

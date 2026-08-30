package com.smartattendance.attendance;

import com.smartattendance.exceptions.*;
import com.smartattendance.model.AttendanceRecord;
import com.smartattendance.model.AttendanceSession;
import com.smartattendance.model.Student;

/**
 * INTEGRATION CONTRACT for Teammate 3 (authentication module).
 * After Teammate 3 authenticates a student (face/RFID/manual code/etc.),
 * they call processAuthenticatedStudent(...) with the result — this module
 * never performs authentication itself, only records/validates attendance.
 */
public interface StudentAttendanceOperations {

    /**
     * Main entry point Teammate 3 calls right after successfully
     * authenticating a student.
     *
     * @param student               the authenticated student (from Teammate 1's model / Teammate 3's auth flow)
     * @param session               the session to mark attendance against (see getActiveSession)
     * @param authenticationMethod  e.g. "ID_CARD", "RFID", "IRIS" - stored on the record for audit purposes
     * @return the saved AttendanceRecord (status will be PRESENT or LATE)
     */
    AttendanceRecord processAuthenticatedStudent(Student student, AttendanceSession session, String authenticationMethod)
            throws StudentNotEnrolledException, InvalidSessionException, AttendanceWindowClosedException,
                   DuplicateAttendanceException;

    /** Looks up the currently active session for a classroom, so Teammate 3 knows what to mark against. */
    AttendanceSession getActiveSession(String classroomId) throws InvalidSessionException;

    /** Lets Teammate 3 pre-check enrollment/session validity before running (possibly costly) authentication. */
    void validateStudentForSession(String studentId, String sessionId)
            throws StudentNotEnrolledException, InvalidSessionException;
}

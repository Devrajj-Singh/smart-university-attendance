package com.smartattendance.exceptions;

/** Thrown when a student has already been marked for a given session. */
public class DuplicateAttendanceException extends AttendanceException {

    private final String studentId;
    private final String sessionId;

    public DuplicateAttendanceException(String studentId, String sessionId) {
        super("Student '" + studentId + "' has already been marked for session '" + sessionId + "'");
        this.studentId = studentId;
        this.sessionId = sessionId;
    }

    public String getStudentId() { return studentId; }
    public String getSessionId() { return sessionId; }
}

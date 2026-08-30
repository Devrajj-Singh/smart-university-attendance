package com.smartattendance.exceptions;

import java.time.LocalDateTime;

/** Thrown when a student attempts to mark attendance outside the configured attendance window. */
public class AttendanceWindowClosedException extends AttendanceException {

    public AttendanceWindowClosedException(String sessionId, LocalDateTime attemptedAt) {
        super("Attendance window for session '" + sessionId + "' is closed (attempted at " + attemptedAt + ")");
    }

    public AttendanceWindowClosedException(String message) {
        super(message);
    }
}

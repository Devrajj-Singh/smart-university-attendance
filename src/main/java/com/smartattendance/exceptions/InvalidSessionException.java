package com.smartattendance.exceptions;

/** Thrown when a session does not exist, is closed, or is otherwise invalid for the requested operation. */
public class InvalidSessionException extends AttendanceException {

    public InvalidSessionException(String message) {
        super(message);
    }

    public InvalidSessionException(String sessionId, String reason) {
        super("Session '" + sessionId + "' is invalid: " + reason);
    }
}

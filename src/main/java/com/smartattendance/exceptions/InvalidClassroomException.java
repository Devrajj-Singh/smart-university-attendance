package com.smartattendance.exceptions;

/** Thrown when the classroom supplied does not match the session's scheduled classroom, or does not exist. */
public class InvalidClassroomException extends AttendanceException {

    public InvalidClassroomException(String classroomId, String sessionId) {
        super("Classroom '" + classroomId + "' is not valid for session '" + sessionId + "'");
    }

    public InvalidClassroomException(String message) {
        super(message);
    }
}

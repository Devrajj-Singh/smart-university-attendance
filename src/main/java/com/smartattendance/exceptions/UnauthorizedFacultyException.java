package com.smartattendance.exceptions;

/** Thrown when a faculty member attempts an operation (starting/closing/substituting a session) they are not authorized for. */
public class UnauthorizedFacultyException extends AttendanceException {

    public UnauthorizedFacultyException(String facultyId, String operation) {
        super("Faculty '" + facultyId + "' is not authorized to perform: " + operation);
    }
}

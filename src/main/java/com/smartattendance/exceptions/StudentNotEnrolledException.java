package com.smartattendance.exceptions;

/** Thrown when a student tries to mark attendance for a class they are not enrolled in. */
public class StudentNotEnrolledException extends AttendanceException {

    public StudentNotEnrolledException(String studentId, String classId) {
        super("Student '" + studentId + "' is not enrolled in class '" + classId + "'");
    }
}

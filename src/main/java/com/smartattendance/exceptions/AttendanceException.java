package com.smartattendance.exceptions;

/**
 * Base checked exception for every attendance-domain error.
 *
 * Kept abstract so it can never be thrown directly — callers must throw
 * (and may catch) one of the specific subclasses, while code that only
 * cares about "something went wrong in attendance" can catch this type
 * and handle all of them polymorphically.
 */
public class AttendanceException extends Exception {

    public AttendanceException(String message) {
        super(message);
    }

    public AttendanceException(String message, Throwable cause) {
        super(message, cause);
    }
}

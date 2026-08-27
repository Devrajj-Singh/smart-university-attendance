package com.smartattendance.authentication;

import com.smartattendance.model.Student;
import java.time.LocalDateTime;

public final class AuthenticationResult {

    public enum Status {
        SUCCESS, FAILED, UNKNOWN_USER, INVALID_CARD, BIOMETRIC_MISMATCH, DEVICE_ERROR
    }

    private final Status status;
    private final Student student;
    private final String message;
    private final LocalDateTime timestamp;

    public AuthenticationResult(Status status, Student student, String message) {
        this.status = status;
        this.student = student;
        this.message = message;
        this.timestamp = LocalDateTime.now();
    }

    public Status getStatus() { return status; }
    public Student getStudent() { return student; }
    public String getMessage() { return message; }
    public LocalDateTime getTimestamp() { return timestamp; }
    public boolean isSuccessful() { return status == Status.SUCCESS; }

    @Override
    public String toString() {
        var studentId = (student != null) ? student.getStudentId() : "N/A";
        return "AuthenticationResult{status=" + status
                + ", student=" + studentId
                + ", message='" + message + "'"
                + ", timestamp=" + timestamp + "}";
    }
}

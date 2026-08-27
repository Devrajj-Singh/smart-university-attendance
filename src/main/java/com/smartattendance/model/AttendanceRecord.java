package com.smartattendance.model;

import java.time.LocalDateTime;

/**
 * One student's attendance entry for one AttendanceSession.
 * "synced" tracks whether an offline-captured record has been pushed
 * to the central server yet - used by the sync module.
 */
public class AttendanceRecord {

    public enum AuthMethod {
        CARD, BIOMETRIC, MANUAL
    }

    public enum AttendanceStatus {
        PRESENT, ABSENT, LATE
    }

    private String recordId;
    private String sessionId;
    private String studentId;
    private LocalDateTime timestamp;
    private AuthMethod method;
    private AttendanceStatus status;
    private boolean synced;

    public AttendanceRecord(String recordId, String sessionId, String studentId,
                             LocalDateTime timestamp, AuthMethod method,
                             AttendanceStatus status, boolean synced) {
        this.recordId = recordId;
        this.sessionId = sessionId;
        this.studentId = studentId;
        this.timestamp = timestamp;
        this.method = method;
        this.status = status;
        this.synced = synced;
    }

    public String getRecordId() {
        return recordId;
    }

    public String getSessionId() {
        return sessionId;
    }

    public String getStudentId() {
        return studentId;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public AuthMethod getMethod() {
        return method;
    }

    public AttendanceStatus getStatus() {
        return status;
    }

    public boolean isSynced() {
        return synced;
    }

    public void setStatus(AttendanceStatus status) {
        this.status = status;
    }

    public void markSynced() {
        this.synced = true;
    }
}

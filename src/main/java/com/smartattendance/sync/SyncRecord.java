package com.smartattendance.sync;

import java.time.LocalDateTime;

public class SyncRecord {

    public enum Status { PENDING, SYNCED, FAILED }

    private final String syncId;
    private final String attendanceId;
    private final LocalDateTime timestamp;
    private Status status;
    private int retryCount;

    public SyncRecord(String syncId, String attendanceId) {
        this.syncId = syncId;
        this.attendanceId = attendanceId;
        this.timestamp = LocalDateTime.now();
        this.status = Status.PENDING;
        this.retryCount = 0;
    }

    public String getSyncId() { return syncId; }
    public String getAttendanceId() { return attendanceId; }
    public LocalDateTime getTimestamp() { return timestamp; }
    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }
    public int getRetryCount() { return retryCount; }
    public void incrementRetry() { this.retryCount++; }

    @Override
    public String toString() {
        return "SyncRecord{syncId='" + syncId + "', attendanceId='" + attendanceId
                + "', status=" + status + ", retryCount=" + retryCount + "}";
    }
}

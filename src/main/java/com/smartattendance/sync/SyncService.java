package com.smartattendance.sync;

import com.smartattendance.database.repository.AttendanceRepository;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public class SyncService {

    private static final int MAX_RETRIES = 3;

    private final AttendanceRepository attendanceRepository;
    private final UniversityAttendanceBackend backend;
    private final Map<String, SyncRecord> syncRecords = new LinkedHashMap<>();

    public SyncService(AttendanceRepository attendanceRepository, UniversityAttendanceBackend backend) {
        this.attendanceRepository = attendanceRepository;
        this.backend = backend;
    }

    public SyncRecord enqueue(String attendanceId) {
        var syncId = "SYNC-" + UUID.randomUUID();
        var syncRecord = new SyncRecord(syncId, attendanceId);
        syncRecords.put(attendanceId, syncRecord);
        return syncRecord;
    }

    public void triggerSync() {
        for (var entry : syncRecords.entrySet()) {
            var syncRecord = entry.getValue();
            if (syncRecord.getStatus() == SyncRecord.Status.SYNCED) continue;
            attemptSync(entry.getKey(), syncRecord);
        }
    }

    public void retryFailed() {
        for (var syncRecord : syncRecords.values()) {
            if (syncRecord.getStatus() == SyncRecord.Status.FAILED) {
                attemptSync(syncRecord.getAttendanceId(), syncRecord);
            }
        }
    }

    private void attemptSync(String attendanceId, SyncRecord syncRecord) {
        var record = attendanceRepository.findById(attendanceId);
        if (record == null) {
            syncRecord.setStatus(SyncRecord.Status.FAILED);
            return;
        }

        boolean success = backend.submitAttendance(record);

        if (success) {
            syncRecord.setStatus(SyncRecord.Status.SYNCED);
            attendanceRepository.markSynced(attendanceId);
        } else {
            syncRecord.incrementRetry();
            if (syncRecord.getRetryCount() >= MAX_RETRIES) {
                syncRecord.setStatus(SyncRecord.Status.FAILED);
            } else {
                syncRecord.setStatus(SyncRecord.Status.PENDING);
            }
        }
    }

    public long getPendingCount() {
        return syncRecords.values().stream()
                .filter(r -> r.getStatus() == SyncRecord.Status.PENDING)
                .count();
    }

    public SyncRecord.Status getSyncStatus(String attendanceId) {
        var syncRecord = syncRecords.get(attendanceId);
        return (syncRecord == null) ? null : syncRecord.getStatus();
    }

    public List<SyncRecord> getAllSyncRecords() {
        return new ArrayList<>(syncRecords.values());
    }
}

package com.smartattendance.attendance.testsupport;

import com.smartattendance.database.repository.AttendanceRepository;
import com.smartattendance.model.AttendanceRecord;

import java.util.HashMap;
import java.util.Map;

public class InMemoryAttendanceRepository extends AttendanceRepository {

    private final Map<String, AttendanceRecord> records = new HashMap<>();

    public void add(AttendanceRecord record) {
        records.put(record.getRecordId(), record);
    }

    @Override
    public AttendanceRecord findById(String recordId) {
        return records.get(recordId);
    }

    @Override
    public void markSynced(String recordId) {
        AttendanceRecord record = records.get(recordId);
        if (record != null) {
            record.markSynced();
        }
    }
}

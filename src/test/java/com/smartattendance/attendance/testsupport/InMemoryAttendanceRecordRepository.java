package com.smartattendance.attendance.testsupport;

import com.smartattendance.database.repository.AttendanceRecordRepository;
import com.smartattendance.model.AttendanceRecord;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/** Simple in-memory fake used only for tests/demos. */
public class InMemoryAttendanceRecordRepository extends AttendanceRecordRepository {

    private final List<AttendanceRecord> records = new ArrayList<>();

    @Override
    public AttendanceRecord save(AttendanceRecord record) {
        records.add(record);
        return record;
    }

    @Override
    public List<AttendanceRecord> findBySession(String sessionId) {
        return records.stream().filter(r -> r.getSessionId().equals(sessionId)).collect(Collectors.toList());
    }

    @Override
    public List<AttendanceRecord> findByStudent(String studentId) {
        return records.stream().filter(r -> r.getStudentId().equals(studentId)).collect(Collectors.toList());
    }

    @Override
    public boolean existsByStudentAndSession(String studentId, String sessionId) {
        return records.stream()
                .anyMatch(r -> r.getStudentId().equals(studentId) && r.getSessionId().equals(sessionId));
    }

    @Override
    public AttendanceRecord findById(String recordId) {
        return records.stream().filter(r -> r.getRecordId().equals(recordId)).findFirst().orElse(null);
    }
}

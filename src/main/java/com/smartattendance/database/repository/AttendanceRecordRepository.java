package com.smartattendance.database.repository;

import com.smartattendance.model.AttendanceRecord;

import java.util.List;

public class AttendanceRecordRepository {

    private final AttendanceRepository attendanceRepository;

    public AttendanceRecordRepository() {
        this(new AttendanceRepository());
    }

    public AttendanceRecordRepository(AttendanceRepository attendanceRepository) {
        this.attendanceRepository = attendanceRepository;
    }

    public AttendanceRecord save(AttendanceRecord record) {
        attendanceRepository.insertRecord(record);
        return record;
    }

    public AttendanceRecord findById(String recordId) {
        return attendanceRepository.findById(recordId);
    }

    public List<AttendanceRecord> findBySession(String sessionId) {
        return attendanceRepository.findRecordsBySession(sessionId);
    }

    public List<AttendanceRecord> findByStudent(String studentId) {
        return attendanceRepository.findRecordsByStudent(studentId);
    }

    public List<AttendanceRecord> findUnsynced() {
        return attendanceRepository.findUnsyncedRecords();
    }

    public boolean existsByStudentAndSession(String studentId, String sessionId) {
        return findBySession(sessionId).stream().anyMatch(record -> record.getStudentId().equals(studentId));
    }

    public void markSynced(String recordId) {
        attendanceRepository.markRecordSynced(recordId);
    }
}

package com.smartattendance.attendance;

import com.smartattendance.database.repository.AttendanceRecordRepository;
import com.smartattendance.exceptions.InvalidSessionException;
import com.smartattendance.model.AttendanceRecord;
import com.smartattendance.model.AttendanceStatus;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Turns raw AttendanceRecord rows into the numbers people actually want:
 * percentages, present/late/absent counts, and a simple low-attendance flag.
 *
 * Kept as its own class (rather than folded into AttendanceService) because
 * reporting has a different reason to change than session/marking logic -
 * single responsibility principle.
 */
public class AttendanceReportService {

    /** Below this percentage a student is flagged as "low attendance". Configurable per institution policy. */
    private final double lowAttendanceThresholdPercent;

    private final AttendanceRecordRepository recordRepository;

    public AttendanceReportService(AttendanceRecordRepository recordRepository) {
        this(recordRepository, 75.0);
    }

    public AttendanceReportService(AttendanceRecordRepository recordRepository, double lowAttendanceThresholdPercent) {
        this.recordRepository = recordRepository;
        this.lowAttendanceThresholdPercent = lowAttendanceThresholdPercent;
    }

    /** present + late count as "attended" for percentage purposes; only ABSENT counts against the student. */
    public double calculateAttendancePercentage(String studentId, List<String> sessionIds) {
        if (sessionIds.isEmpty()) return 0.0;

        List<AttendanceRecord> records = recordRepository.findByStudent(studentId);
        long attended = records.stream()
                .filter(r -> sessionIds.contains(r.getSessionId()))
                .filter(r -> r.getStatus() != AttendanceStatus.ABSENT)
                .count();

        return (attended * 100.0) / sessionIds.size();
    }

    /** Overload: percentage across every session the student has any record for. */
    public double calculateAttendancePercentage(String studentId, int totalSessionsHeld) {
        if (totalSessionsHeld <= 0) return 0.0;

        List<AttendanceRecord> records = recordRepository.findByStudent(studentId);
        long attended = records.stream()
                .filter(r -> r.getStatus() != AttendanceStatus.ABSENT)
                .count();

        return (attended * 100.0) / totalSessionsHeld;
    }

    /** Present/late/absent counts for one session (e.g. the live dashboard view of who's marked so far). */
    public Map<AttendanceStatus, Long> countStatusesForSession(String sessionId) {
        List<AttendanceRecord> records = recordRepository.findBySession(sessionId);

        var counts = new LinkedHashMap<AttendanceStatus, Long>();
        for (var status : AttendanceStatus.values()) {
            counts.put(status, 0L);
        }
        for (AttendanceRecord record : records) {
            counts.merge(record.getStatus(), 1L, Long::sum);
        }
        return counts;
    }

    public boolean isLowAttendance(double attendancePercentage) {
        return attendancePercentage < lowAttendanceThresholdPercent;
    }

    /**
     * Builds the full summary map handed to Teammate 4's dashboard via
     * FacultyDashboardOperations.getAttendanceSummary(sessionId).
     */
    public Map<String, Object> buildSessionSummary(String sessionId) throws InvalidSessionException {
        List<AttendanceRecord> records = recordRepository.findBySession(sessionId);
        if (records.isEmpty()) {
            // Not necessarily an error - a brand new session may have zero marks yet -
            // but if the sessionId itself is unknown to the caller, they should have
            // caught that earlier via AttendanceSessionRepository.findById(...).
        }

        Map<AttendanceStatus, Long> counts = countStatusesForSession(sessionId);
        long totalMarked = records.size();

        var summary = new LinkedHashMap<String, Object>();
        summary.put("sessionId", sessionId);
        summary.put("totalMarked", totalMarked);
        summary.put("present", counts.get(AttendanceStatus.PRESENT));
        summary.put("late", counts.get(AttendanceStatus.LATE));
        summary.put("absent", counts.get(AttendanceStatus.ABSENT));
        return summary;
    }
}

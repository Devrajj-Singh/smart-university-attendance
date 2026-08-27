package com.smartattendance.database.repository;

import com.smartattendance.database.DatabaseManager;
import com.smartattendance.model.AttendanceRecord;
import com.smartattendance.model.AttendanceSession;
import com.smartattendance.model.Classroom;
import com.smartattendance.model.ClassSection;
import com.smartattendance.model.Faculty;
import com.smartattendance.model.Subject;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Handles both attendance_sessions and attendance_records - the two
 * tables the attendance engine and sync module touch most.
 *
 * Sessions are stored with foreign-key ids, but read back out as full
 * AttendanceSession objects (with real Subject/ClassSection/Classroom/
 * Faculty objects attached), using the other repositories internally,
 * so callers never have to do their own joins.
 */
public class AttendanceRepository {

    private final Connection connection;
    private final SubjectRepository subjectRepository;
    private final ClassSectionRepository classSectionRepository;
    private final ClassroomRepository classroomRepository;
    private final FacultyRepository facultyRepository;

    public AttendanceRepository() {
        this.connection = DatabaseManager.getInstance().getConnection();
        this.subjectRepository = new SubjectRepository();
        this.classSectionRepository = new ClassSectionRepository();
        this.classroomRepository = new ClassroomRepository();
        this.facultyRepository = new FacultyRepository();
    }

    // ---------- Attendance Sessions ----------

    public void insertSession(AttendanceSession session) {
        String sql = "INSERT INTO attendance_sessions " +
                "(session_id, subject_id, class_id, classroom_id, scheduled_faculty_id, actual_faculty_id, " +
                "start_time, end_time, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
        try (PreparedStatement ps = connection.prepareStatement(sql)) {
            ps.setString(1, session.getSessionId());
            ps.setString(2, session.getSubject().getSubjectId());
            ps.setString(3, session.getClassSection().getClassId());
            ps.setString(4, session.getClassroom().getClassroomId());
            ps.setString(5, session.getScheduledFaculty().getUserId());
            ps.setString(6, session.getActualFaculty() != null ? session.getActualFaculty().getUserId() : null);
            ps.setString(7, session.getStartTime().toString());
            ps.setString(8, session.getEndTime().toString());
            ps.setString(9, session.getStatus().name());
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException("Failed to insert attendance session: " + e.getMessage(), e);
        }
    }

    public AttendanceSession findSessionById(String sessionId) {
        String sql = "SELECT * FROM attendance_sessions WHERE session_id = ?";
        try (PreparedStatement ps = connection.prepareStatement(sql)) {
            ps.setString(1, sessionId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return mapSessionRow(rs);
                }
            }
        } catch (SQLException e) {
            throw new RuntimeException("Failed to find attendance session: " + e.getMessage(), e);
        }
        return null;
    }

    public List<AttendanceSession> findSessionsByClassId(String classId) {
        List<AttendanceSession> results = new ArrayList<>();
        String sql = "SELECT * FROM attendance_sessions WHERE class_id = ?";
        try (PreparedStatement ps = connection.prepareStatement(sql)) {
            ps.setString(1, classId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    results.add(mapSessionRow(rs));
                }
            }
        } catch (SQLException e) {
            throw new RuntimeException("Failed to find sessions by class: " + e.getMessage(), e);
        }
        return results;
    }

    public List<AttendanceSession> findAllSessions() {
        List<AttendanceSession> results = new ArrayList<>();
        String sql = "SELECT * FROM attendance_sessions";
        try (Statement stmt = connection.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {
            while (rs.next()) {
                results.add(mapSessionRow(rs));
            }
        } catch (SQLException e) {
            throw new RuntimeException("Failed to fetch attendance sessions: " + e.getMessage(), e);
        }
        return results;
    }

    public void updateSessionStatus(String sessionId, AttendanceSession.SessionStatus status, String actualFacultyId) {
        String sql = "UPDATE attendance_sessions SET status = ?, actual_faculty_id = ? WHERE session_id = ?";
        try (PreparedStatement ps = connection.prepareStatement(sql)) {
            ps.setString(1, status.name());
            ps.setString(2, actualFacultyId);
            ps.setString(3, sessionId);
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException("Failed to update session status: " + e.getMessage(), e);
        }
    }

    // ---------- Attendance Records ----------

    public void insertRecord(AttendanceRecord record) {
        String sql = "INSERT INTO attendance_records " +
                "(record_id, session_id, student_id, timestamp, method, status, synced) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?)";
        try (PreparedStatement ps = connection.prepareStatement(sql)) {
            ps.setString(1, record.getRecordId());
            ps.setString(2, record.getSessionId());
            ps.setString(3, record.getStudentId());
            ps.setString(4, record.getTimestamp().toString());
            ps.setString(5, record.getMethod().name());
            ps.setString(6, record.getStatus().name());
            ps.setInt(7, record.isSynced() ? 1 : 0);
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException("Failed to insert attendance record: " + e.getMessage(), e);
        }
    }

    public List<AttendanceRecord> findRecordsBySession(String sessionId) {
        return queryRecords("session_id", sessionId);
    }

    public List<AttendanceRecord> findRecordsByStudent(String studentId) {
        return queryRecords("student_id", studentId);
    }

    public List<AttendanceRecord> findUnsyncedRecords() {
        List<AttendanceRecord> results = new ArrayList<>();
        String sql = "SELECT * FROM attendance_records WHERE synced = 0";
        try (Statement stmt = connection.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {
            while (rs.next()) {
                results.add(mapRecordRow(rs));
            }
        } catch (SQLException e) {
            throw new RuntimeException("Failed to fetch unsynced records: " + e.getMessage(), e);
        }
        return results;
    }

    public void markRecordSynced(String recordId) {
        String sql = "UPDATE attendance_records SET synced = 1 WHERE record_id = ?";
        try (PreparedStatement ps = connection.prepareStatement(sql)) {
            ps.setString(1, recordId);
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException("Failed to mark record synced: " + e.getMessage(), e);
        }
    }

    private List<AttendanceRecord> queryRecords(String column, String value) {
        List<AttendanceRecord> results = new ArrayList<>();
        String sql = "SELECT * FROM attendance_records WHERE " + column + " = ?";
        try (PreparedStatement ps = connection.prepareStatement(sql)) {
            ps.setString(1, value);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    results.add(mapRecordRow(rs));
                }
            }
        } catch (SQLException e) {
            throw new RuntimeException("Failed to query attendance records: " + e.getMessage(), e);
        }
        return results;
    }

    // ---------- Row mapping helpers ----------

    private AttendanceSession mapSessionRow(ResultSet rs) throws SQLException {
        Subject subject = subjectRepository.findById(rs.getString("subject_id"));
        ClassSection classSection = classSectionRepository.findById(rs.getString("class_id"));
        Classroom classroom = classroomRepository.findById(rs.getString("classroom_id"));
        Faculty scheduledFaculty = facultyRepository.findById(rs.getString("scheduled_faculty_id"));
        String actualFacultyId = rs.getString("actual_faculty_id");
        Faculty actualFaculty = actualFacultyId != null ? facultyRepository.findById(actualFacultyId) : null;

        return new AttendanceSession(
                rs.getString("session_id"),
                subject,
                classSection,
                classroom,
                scheduledFaculty,
                actualFaculty,
                LocalDateTime.parse(rs.getString("start_time")),
                LocalDateTime.parse(rs.getString("end_time")),
                AttendanceSession.SessionStatus.valueOf(rs.getString("status"))
        );
    }

    private AttendanceRecord mapRecordRow(ResultSet rs) throws SQLException {
        return new AttendanceRecord(
                rs.getString("record_id"),
                rs.getString("session_id"),
                rs.getString("student_id"),
                LocalDateTime.parse(rs.getString("timestamp")),
                AttendanceRecord.AuthMethod.valueOf(rs.getString("method")),
                AttendanceRecord.AttendanceStatus.valueOf(rs.getString("status")),
                rs.getInt("synced") == 1
        );
    }
}

package com.smartattendance.database.repository;

import com.smartattendance.database.DatabaseManager;
import com.smartattendance.model.Timetable;
import com.smartattendance.model.TimetableSlot;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

public class TimetableRepository {

    private final Connection connection;

    public TimetableRepository() {
        this.connection = DatabaseManager.getInstance().getConnection();
    }

    public void insert(Timetable entry) {
        String sql = "INSERT INTO timetable " +
                "(timetable_id, subject_id, class_id, faculty_id, classroom_id, day_of_week, start_time, end_time) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        try (PreparedStatement ps = connection.prepareStatement(sql)) {
            ps.setString(1, entry.getTimetableId());
            ps.setString(2, entry.getSubjectId());
            ps.setString(3, entry.getClassId());
            ps.setString(4, entry.getFacultyId());
            ps.setString(5, entry.getClassroomId());
            ps.setString(6, entry.getDayOfWeek().name());
            ps.setString(7, entry.getStartTime().toString());
            ps.setString(8, entry.getEndTime().toString());
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException("Failed to insert timetable entry: " + e.getMessage(), e);
        }
    }

    public Timetable findById(String timetableId) {
        String sql = "SELECT * FROM timetable WHERE timetable_id = ?";
        try (PreparedStatement ps = connection.prepareStatement(sql)) {
            ps.setString(1, timetableId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return mapRow(rs);
                }
            }
        } catch (SQLException e) {
            throw new RuntimeException("Failed to find timetable entry: " + e.getMessage(), e);
        }
        return null;
    }

    public List<Timetable> findByFacultyId(String facultyId) {
        return queryByColumn("faculty_id", facultyId);
    }

    public List<TimetableSlot> findByClassId(String classId) {
        return toSlots(queryByColumn("class_id", classId));
    }

    public List<Timetable> findByDay(DayOfWeek day) {
        return queryByColumn("day_of_week", day.name());
    }

    public List<TimetableSlot> findByFacultyAndDay(String facultyId, DayOfWeek day) {
        List<TimetableSlot> results = new ArrayList<>();
        for (Timetable timetable : findByFacultyId(facultyId)) {
            if (timetable.getDayOfWeek() == day) {
                results.add(new TimetableSlot(timetable));
            }
        }
        return results;
    }

    public List<TimetableSlot> findByClassroomAndDay(String classroomId, DayOfWeek day) {
        List<TimetableSlot> results = new ArrayList<>();
        for (Timetable timetable : findByDay(day)) {
            if (timetable.getClassroomId().equals(classroomId)) {
                results.add(new TimetableSlot(timetable));
            }
        }
        return results;
    }

    public List<Timetable> findAll() {
        List<Timetable> results = new ArrayList<>();
        String sql = "SELECT * FROM timetable";
        try (Statement stmt = connection.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {
            while (rs.next()) {
                results.add(mapRow(rs));
            }
        } catch (SQLException e) {
            throw new RuntimeException("Failed to fetch timetable: " + e.getMessage(), e);
        }
        return results;
    }

    public void delete(String timetableId) {
        String sql = "DELETE FROM timetable WHERE timetable_id = ?";
        try (PreparedStatement ps = connection.prepareStatement(sql)) {
            ps.setString(1, timetableId);
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException("Failed to delete timetable entry: " + e.getMessage(), e);
        }
    }

    private List<Timetable> queryByColumn(String column, String value) {
        List<Timetable> results = new ArrayList<>();
        String sql = "SELECT * FROM timetable WHERE " + column + " = ?";
        try (PreparedStatement ps = connection.prepareStatement(sql)) {
            ps.setString(1, value);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    results.add(mapRow(rs));
                }
            }
        } catch (SQLException e) {
            throw new RuntimeException("Failed to query timetable: " + e.getMessage(), e);
        }
        return results;
    }

    private Timetable mapRow(ResultSet rs) throws SQLException {
        return new Timetable(
                rs.getString("timetable_id"),
                rs.getString("subject_id"),
                rs.getString("class_id"),
                rs.getString("faculty_id"),
                rs.getString("classroom_id"),
                DayOfWeek.valueOf(rs.getString("day_of_week")),
                LocalTime.parse(rs.getString("start_time")),
                LocalTime.parse(rs.getString("end_time"))
        );
    }

    private List<TimetableSlot> toSlots(List<Timetable> timetables) {
        List<TimetableSlot> slots = new ArrayList<>();
        for (Timetable timetable : timetables) {
            slots.add(new TimetableSlot(timetable));
        }
        return slots;
    }
}

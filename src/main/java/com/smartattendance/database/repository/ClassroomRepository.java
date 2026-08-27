package com.smartattendance.database.repository;

import com.smartattendance.database.DatabaseManager;
import com.smartattendance.model.Classroom;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;

/**
 * Small supporting repository (see note in ClassSectionRepository) -
 * needed so AttendanceRepository/TimetableRepository/dummy data have
 * somewhere to store and fetch Classroom rows.
 */
public class ClassroomRepository {

    private final Connection connection;

    public ClassroomRepository() {
        this.connection = DatabaseManager.getInstance().getConnection();
    }

    public void insert(Classroom classroom) {
        String sql = "INSERT INTO classrooms (classroom_id, room_number, building, capacity) VALUES (?, ?, ?, ?)";
        try (PreparedStatement ps = connection.prepareStatement(sql)) {
            ps.setString(1, classroom.getClassroomId());
            ps.setString(2, classroom.getRoomNumber());
            ps.setString(3, classroom.getBuilding());
            ps.setInt(4, classroom.getCapacity());
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException("Failed to insert classroom: " + e.getMessage(), e);
        }
    }

    public Classroom findById(String classroomId) {
        String sql = "SELECT * FROM classrooms WHERE classroom_id = ?";
        try (PreparedStatement ps = connection.prepareStatement(sql)) {
            ps.setString(1, classroomId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return mapRow(rs);
                }
            }
        } catch (SQLException e) {
            throw new RuntimeException("Failed to find classroom: " + e.getMessage(), e);
        }
        return null;
    }

    public List<Classroom> findAll() {
        List<Classroom> results = new ArrayList<>();
        String sql = "SELECT * FROM classrooms";
        try (Statement stmt = connection.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {
            while (rs.next()) {
                results.add(mapRow(rs));
            }
        } catch (SQLException e) {
            throw new RuntimeException("Failed to fetch classrooms: " + e.getMessage(), e);
        }
        return results;
    }

    private Classroom mapRow(ResultSet rs) throws SQLException {
        return new Classroom(
                rs.getString("classroom_id"),
                rs.getString("room_number"),
                rs.getString("building"),
                rs.getInt("capacity")
        );
    }
}

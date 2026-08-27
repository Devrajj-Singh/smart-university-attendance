package com.smartattendance.database.repository;

import com.smartattendance.database.DatabaseManager;
import com.smartattendance.model.ClassSection;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;

/**
 * Not in the originally requested repository list, but needed as a
 * small supporting repository: AttendanceRepository has to look up
 * ClassSection objects to build full AttendanceSession objects, and
 * dummy data needs somewhere to insert class sections.
 */
public class ClassSectionRepository {

    private final Connection connection;

    public ClassSectionRepository() {
        this.connection = DatabaseManager.getInstance().getConnection();
    }

    public void insert(ClassSection section) {
        String sql = "INSERT INTO class_sections (class_id, class_name, department, year) VALUES (?, ?, ?, ?)";
        try (PreparedStatement ps = connection.prepareStatement(sql)) {
            ps.setString(1, section.getClassId());
            ps.setString(2, section.getClassName());
            ps.setString(3, section.getDepartment());
            ps.setInt(4, section.getYear());
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException("Failed to insert class section: " + e.getMessage(), e);
        }
    }

    public ClassSection findById(String classId) {
        String sql = "SELECT * FROM class_sections WHERE class_id = ?";
        try (PreparedStatement ps = connection.prepareStatement(sql)) {
            ps.setString(1, classId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return mapRow(rs);
                }
            }
        } catch (SQLException e) {
            throw new RuntimeException("Failed to find class section: " + e.getMessage(), e);
        }
        return null;
    }

    public List<ClassSection> findAll() {
        List<ClassSection> results = new ArrayList<>();
        String sql = "SELECT * FROM class_sections";
        try (Statement stmt = connection.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {
            while (rs.next()) {
                results.add(mapRow(rs));
            }
        } catch (SQLException e) {
            throw new RuntimeException("Failed to fetch class sections: " + e.getMessage(), e);
        }
        return results;
    }

    private ClassSection mapRow(ResultSet rs) throws SQLException {
        return new ClassSection(
                rs.getString("class_id"),
                rs.getString("class_name"),
                rs.getString("department"),
                rs.getInt("year")
        );
    }
}

package com.smartattendance.database.repository;

import com.smartattendance.database.DatabaseManager;
import com.smartattendance.model.Faculty;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;

/**
 * All SQL for the "faculty" and "faculty_subjects" tables lives here.
 */
public class FacultyRepository {

    private final Connection connection;

    public FacultyRepository() {
        this.connection = DatabaseManager.getInstance().getConnection();
    }

    public void insert(Faculty faculty) {
        String sql = "INSERT INTO faculty (user_id, name, email, employee_code, department) " +
                "VALUES (?, ?, ?, ?, ?)";
        try (PreparedStatement ps = connection.prepareStatement(sql)) {
            ps.setString(1, faculty.getUserId());
            ps.setString(2, faculty.getName());
            ps.setString(3, faculty.getEmail());
            ps.setString(4, faculty.getEmployeeCode());
            ps.setString(5, faculty.getDepartment());
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException("Failed to insert faculty: " + e.getMessage(), e);
        }
        for (String subjectId : faculty.getSubjectIds()) {
            assignSubject(faculty.getUserId(), subjectId);
        }
    }

    public Faculty findById(String userId) {
        String sql = "SELECT * FROM faculty WHERE user_id = ?";
        try (PreparedStatement ps = connection.prepareStatement(sql)) {
            ps.setString(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return mapRow(rs);
                }
            }
        } catch (SQLException e) {
            throw new RuntimeException("Failed to find faculty: " + e.getMessage(), e);
        }
        return null;
    }

    public List<Faculty> findAll() {
        List<Faculty> results = new ArrayList<>();
        String sql = "SELECT * FROM faculty";
        try (Statement stmt = connection.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {
            while (rs.next()) {
                results.add(mapRow(rs));
            }
        } catch (SQLException e) {
            throw new RuntimeException("Failed to fetch faculty: " + e.getMessage(), e);
        }
        return results;
    }

    public void update(Faculty faculty) {
        String sql = "UPDATE faculty SET name = ?, email = ?, employee_code = ?, department = ? " +
                "WHERE user_id = ?";
        try (PreparedStatement ps = connection.prepareStatement(sql)) {
            ps.setString(1, faculty.getName());
            ps.setString(2, faculty.getEmail());
            ps.setString(3, faculty.getEmployeeCode());
            ps.setString(4, faculty.getDepartment());
            ps.setString(5, faculty.getUserId());
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException("Failed to update faculty: " + e.getMessage(), e);
        }
    }

    public void delete(String userId) {
        String sql = "DELETE FROM faculty WHERE user_id = ?";
        try (PreparedStatement ps = connection.prepareStatement(sql)) {
            ps.setString(1, userId);
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException("Failed to delete faculty: " + e.getMessage(), e);
        }
    }

    /** Links a faculty member to a subject they teach (faculty_subjects table). */
    public void assignSubject(String facultyId, String subjectId) {
        String sql = "INSERT OR IGNORE INTO faculty_subjects (faculty_id, subject_id) VALUES (?, ?)";
        try (PreparedStatement ps = connection.prepareStatement(sql)) {
            ps.setString(1, facultyId);
            ps.setString(2, subjectId);
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException("Failed to assign subject to faculty: " + e.getMessage(), e);
        }
    }

    public List<String> findSubjectIdsForFaculty(String facultyId) {
        List<String> subjectIds = new ArrayList<>();
        String sql = "SELECT subject_id FROM faculty_subjects WHERE faculty_id = ?";
        try (PreparedStatement ps = connection.prepareStatement(sql)) {
            ps.setString(1, facultyId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    subjectIds.add(rs.getString("subject_id"));
                }
            }
        } catch (SQLException e) {
            throw new RuntimeException("Failed to fetch subjects for faculty: " + e.getMessage(), e);
        }
        return subjectIds;
    }

    private Faculty mapRow(ResultSet rs) throws SQLException {
        Faculty faculty = new Faculty(
                rs.getString("user_id"),
                rs.getString("name"),
                rs.getString("email"),
                rs.getString("employee_code"),
                rs.getString("department")
        );
        for (String subjectId : findSubjectIdsForFaculty(faculty.getUserId())) {
            faculty.assignSubject(subjectId);
        }
        return faculty;
    }
}

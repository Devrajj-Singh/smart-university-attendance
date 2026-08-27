package com.smartattendance.database.repository;

import com.smartattendance.database.DatabaseManager;
import com.smartattendance.model.Subject;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;

public class SubjectRepository {

    private final Connection connection;

    public SubjectRepository() {
        this.connection = DatabaseManager.getInstance().getConnection();
    }

    public void insert(Subject subject) {
        String sql = "INSERT INTO subjects (subject_id, subject_name, subject_code, credit_hours) " +
                "VALUES (?, ?, ?, ?)";
        try (PreparedStatement ps = connection.prepareStatement(sql)) {
            ps.setString(1, subject.getSubjectId());
            ps.setString(2, subject.getSubjectName());
            ps.setString(3, subject.getSubjectCode());
            ps.setInt(4, subject.getCreditHours());
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException("Failed to insert subject: " + e.getMessage(), e);
        }
    }

    public Subject findById(String subjectId) {
        String sql = "SELECT * FROM subjects WHERE subject_id = ?";
        try (PreparedStatement ps = connection.prepareStatement(sql)) {
            ps.setString(1, subjectId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return mapRow(rs);
                }
            }
        } catch (SQLException e) {
            throw new RuntimeException("Failed to find subject: " + e.getMessage(), e);
        }
        return null;
    }

    public List<Subject> findAll() {
        List<Subject> results = new ArrayList<>();
        String sql = "SELECT * FROM subjects";
        try (Statement stmt = connection.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {
            while (rs.next()) {
                results.add(mapRow(rs));
            }
        } catch (SQLException e) {
            throw new RuntimeException("Failed to fetch subjects: " + e.getMessage(), e);
        }
        return results;
    }

    public void update(Subject subject) {
        String sql = "UPDATE subjects SET subject_name = ?, subject_code = ?, credit_hours = ? " +
                "WHERE subject_id = ?";
        try (PreparedStatement ps = connection.prepareStatement(sql)) {
            ps.setString(1, subject.getSubjectName());
            ps.setString(2, subject.getSubjectCode());
            ps.setInt(3, subject.getCreditHours());
            ps.setString(4, subject.getSubjectId());
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException("Failed to update subject: " + e.getMessage(), e);
        }
    }

    public void delete(String subjectId) {
        String sql = "DELETE FROM subjects WHERE subject_id = ?";
        try (PreparedStatement ps = connection.prepareStatement(sql)) {
            ps.setString(1, subjectId);
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException("Failed to delete subject: " + e.getMessage(), e);
        }
    }

    private Subject mapRow(ResultSet rs) throws SQLException {
        return new Subject(
                rs.getString("subject_id"),
                rs.getString("subject_name"),
                rs.getString("subject_code"),
                rs.getInt("credit_hours")
        );
    }
}

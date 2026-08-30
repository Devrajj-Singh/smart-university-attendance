package com.smartattendance.database.repository;

import com.smartattendance.database.DatabaseManager;
import com.smartattendance.model.Student;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;

/**
 * All SQL for the "students" table lives here. Other modules should
 * use this class instead of writing their own SQL against students.
 */
public class StudentRepository {

    private final Connection connection;

    public StudentRepository() {
        this.connection = DatabaseManager.getInstance().getConnection();
    }

    public void insert(Student student) {
        String sql = "INSERT INTO students (user_id, name, email, card_id, biometric_id, class_id) " +
                "VALUES (?, ?, ?, ?, ?, ?)";
        try (PreparedStatement ps = connection.prepareStatement(sql)) {
            ps.setString(1, student.getUserId());
            ps.setString(2, student.getName());
            ps.setString(3, student.getEmail());
            ps.setString(4, student.getCardId());
            ps.setString(5, student.getBiometricId());
            ps.setString(6, student.getClassId());
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException("Failed to insert student: " + e.getMessage(), e);
        }
    }

    public Student findById(String userId) {
        String sql = "SELECT * FROM students WHERE user_id = ?";
        try (PreparedStatement ps = connection.prepareStatement(sql)) {
            ps.setString(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return mapRow(rs);
                }
            }
        } catch (SQLException e) {
            throw new RuntimeException("Failed to find student: " + e.getMessage(), e);
        }
        return null;
    }

    public Student findByCardId(String cardId) {
        String sql = "SELECT * FROM students WHERE card_id = ?";
        try (PreparedStatement ps = connection.prepareStatement(sql)) {
            ps.setString(1, cardId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return mapRow(rs);
                }
            }
        } catch (SQLException e) {
            throw new RuntimeException("Failed to find student by card: " + e.getMessage(), e);
        }
        return null;
    }

    public Student findByBiometricId(String biometricId) {
        String sql = "SELECT * FROM students WHERE biometric_id = ?";
        try (PreparedStatement ps = connection.prepareStatement(sql)) {
            ps.setString(1, biometricId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return mapRow(rs);
                }
            }
        } catch (SQLException e) {
            throw new RuntimeException("Failed to find student by biometric id: " + e.getMessage(), e);
        }
        return null;
    }

    public boolean isEnrolledInClass(String studentId, String classId) {
        Student student = findById(studentId);
        return student != null && student.getClassId().equals(classId);
    }

    public List<Student> findByClassId(String classId) {
        List<Student> results = new ArrayList<>();
        String sql = "SELECT * FROM students WHERE class_id = ?";
        try (PreparedStatement ps = connection.prepareStatement(sql)) {
            ps.setString(1, classId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    results.add(mapRow(rs));
                }
            }
        } catch (SQLException e) {
            throw new RuntimeException("Failed to find students by class: " + e.getMessage(), e);
        }
        return results;
    }

    public List<Student> findAll() {
        List<Student> results = new ArrayList<>();
        String sql = "SELECT * FROM students";
        try (Statement stmt = connection.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {
            while (rs.next()) {
                results.add(mapRow(rs));
            }
        } catch (SQLException e) {
            throw new RuntimeException("Failed to fetch students: " + e.getMessage(), e);
        }
        return results;
    }

    public void update(Student student) {
        String sql = "UPDATE students SET name = ?, email = ?, card_id = ?, biometric_id = ?, class_id = ? " +
                "WHERE user_id = ?";
        try (PreparedStatement ps = connection.prepareStatement(sql)) {
            ps.setString(1, student.getName());
            ps.setString(2, student.getEmail());
            ps.setString(3, student.getCardId());
            ps.setString(4, student.getBiometricId());
            ps.setString(5, student.getClassId());
            ps.setString(6, student.getUserId());
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException("Failed to update student: " + e.getMessage(), e);
        }
    }

    public void delete(String userId) {
        String sql = "DELETE FROM students WHERE user_id = ?";
        try (PreparedStatement ps = connection.prepareStatement(sql)) {
            ps.setString(1, userId);
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException("Failed to delete student: " + e.getMessage(), e);
        }
    }

    private Student mapRow(ResultSet rs) throws SQLException {
        return new Student(
                rs.getString("user_id"),
                rs.getString("name"),
                rs.getString("email"),
                rs.getString("card_id"),
                rs.getString("biometric_id"),
                rs.getString("class_id")
        );
    }
}

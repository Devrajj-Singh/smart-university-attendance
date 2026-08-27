package com.smartattendance.database.repository;

import com.smartattendance.database.DatabaseManager;
import com.smartattendance.model.FacultyDelegation;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class DelegationRepository {

    private final Connection connection;

    public DelegationRepository() {
        this.connection = DatabaseManager.getInstance().getConnection();
    }

    public void insert(FacultyDelegation delegation) {
        String sql = "INSERT INTO faculty_delegations " +
                "(delegation_id, timetable_id, original_faculty_id, substitute_faculty_id, date, reason, approved) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?)";
        try (PreparedStatement ps = connection.prepareStatement(sql)) {
            ps.setString(1, delegation.getDelegationId());
            ps.setString(2, delegation.getTimetableId());
            ps.setString(3, delegation.getOriginalFacultyId());
            ps.setString(4, delegation.getSubstituteFacultyId());
            ps.setString(5, delegation.getDate().toString());
            ps.setString(6, delegation.getReason());
            ps.setInt(7, delegation.isApproved() ? 1 : 0);
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException("Failed to insert delegation: " + e.getMessage(), e);
        }
    }

    public FacultyDelegation findById(String delegationId) {
        String sql = "SELECT * FROM faculty_delegations WHERE delegation_id = ?";
        try (PreparedStatement ps = connection.prepareStatement(sql)) {
            ps.setString(1, delegationId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return mapRow(rs);
                }
            }
        } catch (SQLException e) {
            throw new RuntimeException("Failed to find delegation: " + e.getMessage(), e);
        }
        return null;
    }

    public List<FacultyDelegation> findByOriginalFaculty(String facultyId) {
        return queryByColumn("original_faculty_id", facultyId);
    }

    public List<FacultyDelegation> findBySubstituteFaculty(String facultyId) {
        return queryByColumn("substitute_faculty_id", facultyId);
    }

    public List<FacultyDelegation> findAll() {
        List<FacultyDelegation> results = new ArrayList<>();
        String sql = "SELECT * FROM faculty_delegations";
        try (Statement stmt = connection.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {
            while (rs.next()) {
                results.add(mapRow(rs));
            }
        } catch (SQLException e) {
            throw new RuntimeException("Failed to fetch delegations: " + e.getMessage(), e);
        }
        return results;
    }

    public void approve(String delegationId) {
        String sql = "UPDATE faculty_delegations SET approved = 1 WHERE delegation_id = ?";
        try (PreparedStatement ps = connection.prepareStatement(sql)) {
            ps.setString(1, delegationId);
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException("Failed to approve delegation: " + e.getMessage(), e);
        }
    }

    private List<FacultyDelegation> queryByColumn(String column, String value) {
        List<FacultyDelegation> results = new ArrayList<>();
        String sql = "SELECT * FROM faculty_delegations WHERE " + column + " = ?";
        try (PreparedStatement ps = connection.prepareStatement(sql)) {
            ps.setString(1, value);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    results.add(mapRow(rs));
                }
            }
        } catch (SQLException e) {
            throw new RuntimeException("Failed to query delegations: " + e.getMessage(), e);
        }
        return results;
    }

    private FacultyDelegation mapRow(ResultSet rs) throws SQLException {
        return new FacultyDelegation(
                rs.getString("delegation_id"),
                rs.getString("timetable_id"),
                rs.getString("original_faculty_id"),
                rs.getString("substitute_faculty_id"),
                LocalDate.parse(rs.getString("date")),
                rs.getString("reason"),
                rs.getInt("approved") == 1
        );
    }
}

package com.smartattendance.database.repository;

import com.smartattendance.database.DatabaseManager;
import com.smartattendance.model.AuditLog;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Not in the original required list, but added so the "audit_logs"
 * table isn't orphaned - the admin dashboard module will need this.
 */
public class AuditLogRepository {

    private final Connection connection;

    public AuditLogRepository() {
        this.connection = DatabaseManager.getInstance().getConnection();
    }

    public void insert(AuditLog log) {
        String sql = "INSERT INTO audit_logs (log_id, actor_id, action, entity_type, entity_id, timestamp, details) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?)";
        try (PreparedStatement ps = connection.prepareStatement(sql)) {
            ps.setString(1, log.getLogId());
            ps.setString(2, log.getActorId());
            ps.setString(3, log.getAction());
            ps.setString(4, log.getEntityType());
            ps.setString(5, log.getEntityId());
            ps.setString(6, log.getTimestamp().toString());
            ps.setString(7, log.getDetails());
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException("Failed to insert audit log: " + e.getMessage(), e);
        }
    }

    public List<AuditLog> findByActor(String actorId) {
        List<AuditLog> results = new ArrayList<>();
        String sql = "SELECT * FROM audit_logs WHERE actor_id = ?";
        try (PreparedStatement ps = connection.prepareStatement(sql)) {
            ps.setString(1, actorId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    results.add(mapRow(rs));
                }
            }
        } catch (SQLException e) {
            throw new RuntimeException("Failed to query audit logs: " + e.getMessage(), e);
        }
        return results;
    }

    public List<AuditLog> findAll() {
        List<AuditLog> results = new ArrayList<>();
        String sql = "SELECT * FROM audit_logs ORDER BY timestamp DESC";
        try (Statement stmt = connection.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {
            while (rs.next()) {
                results.add(mapRow(rs));
            }
        } catch (SQLException e) {
            throw new RuntimeException("Failed to fetch audit logs: " + e.getMessage(), e);
        }
        return results;
    }

    private AuditLog mapRow(ResultSet rs) throws SQLException {
        return new AuditLog(
                rs.getString("log_id"),
                rs.getString("actor_id"),
                rs.getString("action"),
                rs.getString("entity_type"),
                rs.getString("entity_id"),
                LocalDateTime.parse(rs.getString("timestamp")),
                rs.getString("details")
        );
    }
}

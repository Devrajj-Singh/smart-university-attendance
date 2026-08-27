package com.smartattendance.database.repository;

import com.smartattendance.database.DatabaseManager;
import com.smartattendance.model.BiometricDevice;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Not in the original required list, but added so the
 * "biometric_devices" table isn't orphaned - the attendance module
 * will need this to know which device sits in which classroom.
 */
public class BiometricDeviceRepository {

    private final Connection connection;

    public BiometricDeviceRepository() {
        this.connection = DatabaseManager.getInstance().getConnection();
    }

    public void insert(BiometricDevice device) {
        String sql = "INSERT INTO biometric_devices (device_id, classroom_id, device_type, status, last_sync_time) " +
                "VALUES (?, ?, ?, ?, ?)";
        try (PreparedStatement ps = connection.prepareStatement(sql)) {
            ps.setString(1, device.getDeviceId());
            ps.setString(2, device.getClassroomId());
            ps.setString(3, device.getDeviceType());
            ps.setString(4, device.getStatus().name());
            ps.setString(5, device.getLastSyncTime() != null ? device.getLastSyncTime().toString() : null);
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException("Failed to insert biometric device: " + e.getMessage(), e);
        }
    }

    public BiometricDevice findByClassroomId(String classroomId) {
        String sql = "SELECT * FROM biometric_devices WHERE classroom_id = ?";
        try (PreparedStatement ps = connection.prepareStatement(sql)) {
            ps.setString(1, classroomId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return mapRow(rs);
                }
            }
        } catch (SQLException e) {
            throw new RuntimeException("Failed to find biometric device: " + e.getMessage(), e);
        }
        return null;
    }

    public List<BiometricDevice> findAll() {
        List<BiometricDevice> results = new ArrayList<>();
        String sql = "SELECT * FROM biometric_devices";
        try (Statement stmt = connection.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {
            while (rs.next()) {
                results.add(mapRow(rs));
            }
        } catch (SQLException e) {
            throw new RuntimeException("Failed to fetch biometric devices: " + e.getMessage(), e);
        }
        return results;
    }

    public void updateStatus(String deviceId, BiometricDevice.DeviceStatus status, LocalDateTime lastSyncTime) {
        String sql = "UPDATE biometric_devices SET status = ?, last_sync_time = ? WHERE device_id = ?";
        try (PreparedStatement ps = connection.prepareStatement(sql)) {
            ps.setString(1, status.name());
            ps.setString(2, lastSyncTime != null ? lastSyncTime.toString() : null);
            ps.setString(3, deviceId);
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException("Failed to update biometric device: " + e.getMessage(), e);
        }
    }

    private BiometricDevice mapRow(ResultSet rs) throws SQLException {
        String lastSync = rs.getString("last_sync_time");
        return new BiometricDevice(
                rs.getString("device_id"),
                rs.getString("classroom_id"),
                rs.getString("device_type"),
                BiometricDevice.DeviceStatus.valueOf(rs.getString("status")),
                lastSync != null ? LocalDateTime.parse(lastSync) : null
        );
    }
}

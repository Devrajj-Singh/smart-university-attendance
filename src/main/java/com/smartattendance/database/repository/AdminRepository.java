package com.smartattendance.database.repository;

import com.smartattendance.database.DatabaseManager;
import com.smartattendance.model.Admin;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;

/**
 * Not in the original required list, but added so the "admins" table
 * isn't orphaned - Teammate 3 (auth) will likely need this for admin login.
 */
public class AdminRepository {

    private final Connection connection;

    public AdminRepository() {
        this.connection = DatabaseManager.getInstance().getConnection();
    }

    public void insert(Admin admin) {
        String sql = "INSERT INTO admins (user_id, name, email, access_level) VALUES (?, ?, ?, ?)";
        try (PreparedStatement ps = connection.prepareStatement(sql)) {
            ps.setString(1, admin.getUserId());
            ps.setString(2, admin.getName());
            ps.setString(3, admin.getEmail());
            ps.setString(4, admin.getAccessLevel());
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException("Failed to insert admin: " + e.getMessage(), e);
        }
    }

    public Admin findById(String userId) {
        String sql = "SELECT * FROM admins WHERE user_id = ?";
        try (PreparedStatement ps = connection.prepareStatement(sql)) {
            ps.setString(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return mapRow(rs);
                }
            }
        } catch (SQLException e) {
            throw new RuntimeException("Failed to find admin: " + e.getMessage(), e);
        }
        return null;
    }

    public List<Admin> findAll() {
        List<Admin> results = new ArrayList<>();
        String sql = "SELECT * FROM admins";
        try (Statement stmt = connection.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {
            while (rs.next()) {
                results.add(mapRow(rs));
            }
        } catch (SQLException e) {
            throw new RuntimeException("Failed to fetch admins: " + e.getMessage(), e);
        }
        return results;
    }

    private Admin mapRow(ResultSet rs) throws SQLException {
        return new Admin(
                rs.getString("user_id"),
                rs.getString("name"),
                rs.getString("email"),
                rs.getString("access_level")
        );
    }
}

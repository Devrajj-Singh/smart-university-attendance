package com.smartattendance.model;

/**
 * Represents an administrator who can manage users, timetables and
 * view audit logs.
 */
public class Admin extends User {

    private String accessLevel;

    public Admin(String userId, String name, String email, String accessLevel) {
        super(userId, name, email);
        this.accessLevel = accessLevel;
    }

    public String getAccessLevel() {
        return accessLevel;
    }

    public void setAccessLevel(String accessLevel) {
        this.accessLevel = accessLevel;
    }

    @Override
    public String getRole() {
        return "ADMIN";
    }

    @Override
    public String displayDashboard() {
        return "Admin Dashboard -> " + name + " (Access: " + accessLevel + ")";
    }
}

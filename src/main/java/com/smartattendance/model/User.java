package com.smartattendance.model;

/**
 * Abstract base class for every person who can log into the system.
 * Student, Faculty and Admin all extend this class (INHERITANCE).
 *
 * Fields are protected so subclasses can access them directly, but
 * outside code must go through the getters (ENCAPSULATION).
 */
public abstract class User {

    protected String userId;
    protected String name;
    protected String email;

    public User(String userId, String name, String email) {
        this.userId = userId;
        this.name = name;
        this.email = email;
    }

    public String getUserId() {
        return userId;
    }

    public String getName() {
        return name;
    }

    public String getEmail() {
        return email;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    /**
     * Each subclass reports its own role. Used by the dashboard/auth
     * modules to decide what screens/permissions to show.
     */
    public abstract String getRole();

    /**
     * Each subclass returns a short dashboard summary string.
     * This is the polymorphic method mentioned in the OOP requirements -
     * calling displayDashboard() on a User reference gives different
     * output depending on the real runtime type (Student/Faculty/Admin).
     */
    public abstract String displayDashboard();

    @Override
    public String toString() {
        return getRole() + "{userId='" + userId + "', name='" + name + "', email='" + email + "'}";
    }
}

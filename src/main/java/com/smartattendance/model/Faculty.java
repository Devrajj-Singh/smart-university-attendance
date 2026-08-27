package com.smartattendance.model;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Represents a faculty member. Keeps a small internal list of the
 * subjects they teach; the list is exposed as read-only so outside
 * code cannot mutate it directly (ENCAPSULATION).
 */
public class Faculty extends User {

    private String employeeCode;
    private String department;
    private final List<String> subjectIds;

    public Faculty(String userId, String name, String email,
                    String employeeCode, String department) {
        super(userId, name, email);
        this.employeeCode = employeeCode;
        this.department = department;
        this.subjectIds = new ArrayList<>();
    }

    public String getEmployeeCode() {
        return employeeCode;
    }

    public String getDepartment() {
        return department;
    }

    public List<String> getSubjectIds() {
        return Collections.unmodifiableList(subjectIds);
    }

    public void assignSubject(String subjectId) {
        if (!subjectIds.contains(subjectId)) {
            subjectIds.add(subjectId);
        }
    }

    @Override
    public String getRole() {
        return "FACULTY";
    }

    @Override
    public String displayDashboard() {
        return "Faculty Dashboard -> " + name + " (" + department + ")";
    }
}

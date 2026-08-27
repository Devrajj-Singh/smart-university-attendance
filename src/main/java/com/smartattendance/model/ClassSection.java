package com.smartattendance.model;

/**
 * Represents a batch/section of students, e.g. "CSE-A, Year 2".
 * Named ClassSection (not "Class") to avoid clashing with java.lang.Class.
 */
public class ClassSection {

    private String classId;
    private String className;
    private String department;
    private int year;

    public ClassSection(String classId, String className, String department, int year) {
        this.classId = classId;
        this.className = className;
        this.department = department;
        this.year = year;
    }

    public String getClassId() {
        return classId;
    }

    public String getClassName() {
        return className;
    }

    public String getDepartment() {
        return department;
    }

    public int getYear() {
        return year;
    }

    @Override
    public String toString() {
        return className + " (" + department + ", Year " + year + ")";
    }
}

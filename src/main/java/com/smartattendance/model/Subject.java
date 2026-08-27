package com.smartattendance.model;

/**
 * Represents a course/subject, e.g. "Data Structures" (CS201).
 */
public class Subject {

    private String subjectId;
    private String subjectName;
    private String subjectCode;
    private int creditHours;

    public Subject(String subjectId, String subjectName, String subjectCode, int creditHours) {
        this.subjectId = subjectId;
        this.subjectName = subjectName;
        this.subjectCode = subjectCode;
        this.creditHours = creditHours;
    }

    public String getSubjectId() {
        return subjectId;
    }

    public String getSubjectName() {
        return subjectName;
    }

    public String getSubjectCode() {
        return subjectCode;
    }

    public int getCreditHours() {
        return creditHours;
    }

    @Override
    public String toString() {
        return subjectCode + " - " + subjectName;
    }
}

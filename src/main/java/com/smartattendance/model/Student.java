package com.smartattendance.model;

/**
 * Represents a student. The inherited userId is the university
 * registration number and is the canonical student identity.
 */
public class Student extends User {

    private String cardId;
    private String biometricId;
    private String classId;

    public Student(String userId, String name, String email,
                    String cardId, String biometricId, String classId) {
        super(userId, name, email);
        this.cardId = cardId;
        this.biometricId = biometricId;
        this.classId = classId;
    }

    public Student(String registrationNumber, String name, String classId) {
        this(registrationNumber, name, registrationNumber + "@university.edu",
                "CARD-" + registrationNumber, "IRIS-" + registrationNumber, classId);
    }

    public String getId() {
        return userId;
    }

    public String getStudentId() {
        return userId;
    }

    public String getRegistrationNumber() {
        return userId;
    }

    public String getCardId() {
        return cardId;
    }

    public String getCardUid() {
        return cardId;
    }

    public String getBiometricId() {
        return biometricId;
    }

    public String getClassId() {
        return classId;
    }

    public void setCardId(String cardId) {
        this.cardId = cardId;
    }

    public void setBiometricId(String biometricId) {
        this.biometricId = biometricId;
    }

    public void setClassId(String classId) {
        this.classId = classId;
    }

    @Override
    public String getRole() {
        return "STUDENT";
    }

    @Override
    public String displayDashboard() {
        return "Student Dashboard -> " + name + " (Class: " + classId + ")";
    }
}

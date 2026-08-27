package com.smartattendance.model;

/**
 * Represents a student. Holds the identifiers needed for the two
 * authentication modes the front desk uses: card tap (cardId) and
 * simulated iris biometric (biometricId).
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

    public String getCardId() {
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

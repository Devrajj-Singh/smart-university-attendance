package com.smartattendance.model;

/**
 * Represents a physical classroom where sessions take place and
 * where a BiometricDevice may be installed.
 */
public class Classroom {

    private String classroomId;
    private String roomNumber;
    private String building;
    private int capacity;

    public Classroom(String classroomId, String roomNumber, String building, int capacity) {
        this.classroomId = classroomId;
        this.roomNumber = roomNumber;
        this.building = building;
        this.capacity = capacity;
    }

    public String getClassroomId() {
        return classroomId;
    }

    public String getRoomNumber() {
        return roomNumber;
    }

    public String getBuilding() {
        return building;
    }

    public int getCapacity() {
        return capacity;
    }

    @Override
    public String toString() {
        return building + " - Room " + roomNumber;
    }
}

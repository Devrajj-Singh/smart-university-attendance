package com.smartattendance.model;

import java.time.LocalDateTime;

/**
 * Represents a (simulated) iris/card reader device installed near a
 * classroom, used for the offline-capable attendance capture flow.
 */
public class BiometricDevice {

    public enum DeviceStatus {
        ONLINE, OFFLINE, MAINTENANCE
    }

    private String deviceId;
    private String classroomId;
    private String deviceType;
    private DeviceStatus status;
    private LocalDateTime lastSyncTime;

    public BiometricDevice(String deviceId, String classroomId, String deviceType,
                            DeviceStatus status, LocalDateTime lastSyncTime) {
        this.deviceId = deviceId;
        this.classroomId = classroomId;
        this.deviceType = deviceType;
        this.status = status;
        this.lastSyncTime = lastSyncTime;
    }

    public String getDeviceId() {
        return deviceId;
    }

    public String getClassroomId() {
        return classroomId;
    }

    public String getDeviceType() {
        return deviceType;
    }

    public DeviceStatus getStatus() {
        return status;
    }

    public LocalDateTime getLastSyncTime() {
        return lastSyncTime;
    }

    public boolean isReady() {
        return status == DeviceStatus.ONLINE;
    }

    public void setStatus(DeviceStatus status) {
        this.status = status;
    }

    public void updateLastSyncTime(LocalDateTime time) {
        this.lastSyncTime = time;
    }
}

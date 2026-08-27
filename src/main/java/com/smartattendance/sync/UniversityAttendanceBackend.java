package com.smartattendance.sync;

import com.smartattendance.model.AttendanceRecord;

// DUMMY stand-in for the real backend — no real network call.
public class UniversityAttendanceBackend {

    private boolean online = true;

    public void setOnline(boolean online) {
        this.online = online;
    }

    public boolean isOnline() {
        return online;
    }

    public boolean submitAttendance(AttendanceRecord record) {
        if (record == null) return false;
        return online;
    }
}

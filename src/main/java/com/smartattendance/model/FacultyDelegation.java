package com.smartattendance.model;

import java.time.LocalDate;

/**
 * Records that one faculty member is substituting for another on a
 * given date for a given timetable slot (e.g. faculty is on leave).
 */
public class FacultyDelegation {

    private String delegationId;
    private String timetableId;
    private String originalFacultyId;
    private String substituteFacultyId;
    private LocalDate date;
    private String reason;
    private boolean approved;

    public FacultyDelegation(String delegationId, String timetableId, String originalFacultyId,
                              String substituteFacultyId, LocalDate date, String reason, boolean approved) {
        this.delegationId = delegationId;
        this.timetableId = timetableId;
        this.originalFacultyId = originalFacultyId;
        this.substituteFacultyId = substituteFacultyId;
        this.date = date;
        this.reason = reason;
        this.approved = approved;
    }

    public String getDelegationId() {
        return delegationId;
    }

    public String getTimetableId() {
        return timetableId;
    }

    public String getOriginalFacultyId() {
        return originalFacultyId;
    }

    public String getSubstituteFacultyId() {
        return substituteFacultyId;
    }

    public LocalDate getDate() {
        return date;
    }

    public String getReason() {
        return reason;
    }

    public boolean isApproved() {
        return approved;
    }

    public void approve() {
        this.approved = true;
    }
}

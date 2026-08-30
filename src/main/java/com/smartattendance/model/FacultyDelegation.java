package com.smartattendance.model;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Records that one faculty member is substituting for another on a
 * given date for a given timetable slot (e.g. faculty is on leave).
 */
public class FacultyDelegation {

    private String delegationId;
    private String timetableId;
    private String originalFacultyId;
    private String substituteFacultyId;
    private String authorizedBy;
    private LocalDate date;
    private String reason;
    private boolean approved;
    private DelegationStatus status;
    private LocalDateTime timestamp;
    private LocalDateTime revokedAt;

    public FacultyDelegation(String delegationId, String timetableId, String originalFacultyId,
                              String substituteFacultyId, LocalDate date, String reason, boolean approved) {
        this.delegationId = delegationId;
        this.timetableId = timetableId;
        this.originalFacultyId = originalFacultyId;
        this.substituteFacultyId = substituteFacultyId;
        this.date = date;
        this.reason = reason;
        this.approved = approved;
        this.authorizedBy = originalFacultyId;
        this.status = approved ? DelegationStatus.ACTIVE : DelegationStatus.PENDING;
        this.timestamp = date.atStartOfDay();
    }

    public FacultyDelegation(String delegationId, String sessionId, String originalFacultyId,
                             String alternateFacultyId, String authorizedBy,
                             LocalDateTime timestamp, String status) {
        this.delegationId = delegationId;
        this.timetableId = sessionId;
        this.originalFacultyId = originalFacultyId;
        this.substituteFacultyId = alternateFacultyId;
        this.authorizedBy = authorizedBy;
        this.timestamp = timestamp;
        this.date = timestamp.toLocalDate();
        this.reason = "Faculty delegation";
        this.status = DelegationStatus.valueOf(status);
        this.approved = this.status == DelegationStatus.ACTIVE;
    }

    public String getDelegationId() {
        return delegationId;
    }

    public String getTimetableId() {
        return timetableId;
    }

    public String getSessionId() {
        return timetableId;
    }

    public String getOriginalFacultyId() {
        return originalFacultyId;
    }

    public String getOriginalFaculty() {
        return originalFacultyId;
    }

    public String getSubstituteFacultyId() {
        return substituteFacultyId;
    }

    public String getAlternateFaculty() {
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

    public String getAuthorizedBy() {
        return authorizedBy;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public String getStatus() {
        return status.name();
    }

    public LocalDateTime getRevokedAt() {
        return revokedAt;
    }

    public void approve() {
        this.approved = true;
        this.status = DelegationStatus.ACTIVE;
    }

    public void setStatus(String status) {
        this.status = DelegationStatus.valueOf(status);
        this.approved = this.status == DelegationStatus.ACTIVE;
    }

    public void setRevokedAt(LocalDateTime revokedAt) {
        this.revokedAt = revokedAt;
    }
}

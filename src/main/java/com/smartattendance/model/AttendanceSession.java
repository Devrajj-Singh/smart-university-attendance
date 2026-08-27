package com.smartattendance.model;

import java.time.LocalDateTime;

/**
 * Represents one actual, real-world occurrence of a class - the
 * concrete "instance" of a Timetable slot on a specific date.
 * This is what the attendance/sync/dashboard modules mainly work with.
 *
 * scheduledFaculty is who was supposed to teach it (from the Timetable);
 * actualFaculty is who really taught it (may differ if a FacultyDelegation
 * / substitution happened).
 */
public class AttendanceSession {

    public enum SessionStatus {
        SCHEDULED, ONGOING, COMPLETED, CANCELLED
    }

    private String sessionId;
    private Subject subject;
    private ClassSection classSection;
    private Classroom classroom;
    private Faculty scheduledFaculty;
    private Faculty actualFaculty;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private SessionStatus status;

    public AttendanceSession(String sessionId, Subject subject, ClassSection classSection,
                              Classroom classroom, Faculty scheduledFaculty, Faculty actualFaculty,
                              LocalDateTime startTime, LocalDateTime endTime, SessionStatus status) {
        this.sessionId = sessionId;
        this.subject = subject;
        this.classSection = classSection;
        this.classroom = classroom;
        this.scheduledFaculty = scheduledFaculty;
        this.actualFaculty = actualFaculty;
        this.startTime = startTime;
        this.endTime = endTime;
        this.status = status;
    }

    public String getSessionId() {
        return sessionId;
    }

    public Subject getSubject() {
        return subject;
    }

    public ClassSection getClassSection() {
        return classSection;
    }

    public Classroom getClassroom() {
        return classroom;
    }

    public Faculty getScheduledFaculty() {
        return scheduledFaculty;
    }

    public Faculty getActualFaculty() {
        return actualFaculty;
    }

    public LocalDateTime getStartTime() {
        return startTime;
    }

    public LocalDateTime getEndTime() {
        return endTime;
    }

    public SessionStatus getStatus() {
        return status;
    }

    public void setActualFaculty(Faculty actualFaculty) {
        this.actualFaculty = actualFaculty;
    }

    public void setStatus(SessionStatus status) {
        this.status = status;
    }

    /**
     * Convenience method the dashboard/sync modules can use to flag
     * substituted classes without duplicating the comparison logic.
     */
    public boolean isSubstituted() {
        return actualFaculty != null && scheduledFaculty != null
                && !actualFaculty.getUserId().equals(scheduledFaculty.getUserId());
    }
}

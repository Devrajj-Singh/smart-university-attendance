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

    private String sessionId;
    private String subjectId;
    private String classId;
    private String classroomId;
    private String scheduledFacultyId;
    private String actualFacultyId;
    private Subject subject;
    private ClassSection classSection;
    private Classroom classroom;
    private Faculty scheduledFaculty;
    private Faculty actualFaculty;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private SessionStatus status;
    private SessionType sessionType;

    public AttendanceSession(String sessionId, Subject subject, ClassSection classSection,
                              Classroom classroom, Faculty scheduledFaculty, Faculty actualFaculty,
                              LocalDateTime startTime, LocalDateTime endTime, SessionStatus status) {
        this.sessionId = sessionId;
        this.subjectId = subject != null ? subject.getSubjectId() : null;
        this.classId = classSection != null ? classSection.getClassId() : null;
        this.classroomId = classroom != null ? classroom.getClassroomId() : null;
        this.scheduledFacultyId = scheduledFaculty != null ? scheduledFaculty.getUserId() : null;
        this.actualFacultyId = actualFaculty != null ? actualFaculty.getUserId() : null;
        this.subject = subject;
        this.classSection = classSection;
        this.classroom = classroom;
        this.scheduledFaculty = scheduledFaculty;
        this.actualFaculty = actualFaculty;
        this.startTime = startTime;
        this.endTime = endTime;
        this.status = status;
        this.sessionType = SessionType.AUTOMATIC;
    }

    public AttendanceSession(String sessionId, String subjectId, String classId, String classroomId,
                             String facultyId, LocalDateTime startTime, LocalDateTime endTime, SessionType sessionType) {
        this.sessionId = sessionId;
        this.subjectId = subjectId;
        this.classId = classId;
        this.classroomId = classroomId;
        this.scheduledFacultyId = facultyId;
        this.actualFacultyId = facultyId;
        this.startTime = startTime;
        this.endTime = endTime;
        this.status = SessionStatus.SCHEDULED;
        this.sessionType = sessionType;
    }

    public String getSessionId() {
        return sessionId;
    }

    public String getId() {
        return sessionId;
    }

    public String getSubjectId() {
        return subjectId;
    }

    public String getClassId() {
        return classId;
    }

    public String getClassroomId() {
        return classroomId;
    }

    public String getScheduledFacultyId() {
        return scheduledFacultyId;
    }

    public String getActualFacultyId() {
        return actualFacultyId;
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

    public LocalDateTime getSessionTime() {
        return startTime;
    }

    public Integer getDuration() {
        if (startTime == null || endTime == null) {
            return null;
        }
        return Math.toIntExact(java.time.Duration.between(startTime, endTime).toMinutes());
    }

    public String getClassCode() {
        return classSection != null ? classSection.getClassName() : classId;
    }

    public String getRoomNumber() {
        return classroom != null ? classroom.getRoomNumber() : classroomId;
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
        this.actualFacultyId = actualFaculty != null ? actualFaculty.getUserId() : null;
    }

    public void setActualFacultyId(String actualFacultyId) {
        this.actualFacultyId = actualFacultyId;
    }

    public void setStatus(SessionStatus status) {
        this.status = status;
    }

    /**
     * Convenience method the dashboard/sync modules can use to flag
     * substituted classes without duplicating the comparison logic.
     */
    public boolean isSubstituted() {
        return actualFacultyId != null && scheduledFacultyId != null
                && !actualFacultyId.equals(scheduledFacultyId);
    }

    public SessionType getSessionType() {
        return sessionType;
    }

    @Override
    public String toString() {
        return "AttendanceSession{sessionId='" + sessionId + "', subjectId='" + subjectId
                + "', classId='" + classId + "', classroomId='" + classroomId
                + "', scheduledFacultyId='" + scheduledFacultyId + "', actualFacultyId='"
                + actualFacultyId + "', status=" + status + ", type=" + sessionType + "}";
    }
}

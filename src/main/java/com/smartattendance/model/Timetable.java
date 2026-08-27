package com.smartattendance.model;

import java.time.DayOfWeek;
import java.time.LocalTime;

/**
 * Represents one recurring weekly slot: which subject is taught to
 * which class, by which faculty, in which room, on which day/time.
 * The "Automatic Mode" attendance engine uses this to figure out
 * which session should currently be running.
 */
public class Timetable {

    private String timetableId;
    private String subjectId;
    private String classId;
    private String facultyId;
    private String classroomId;
    private DayOfWeek dayOfWeek;
    private LocalTime startTime;
    private LocalTime endTime;

    public Timetable(String timetableId, String subjectId, String classId,
                      String facultyId, String classroomId,
                      DayOfWeek dayOfWeek, LocalTime startTime, LocalTime endTime) {
        this.timetableId = timetableId;
        this.subjectId = subjectId;
        this.classId = classId;
        this.facultyId = facultyId;
        this.classroomId = classroomId;
        this.dayOfWeek = dayOfWeek;
        this.startTime = startTime;
        this.endTime = endTime;
    }

    public String getTimetableId() {
        return timetableId;
    }

    public String getSubjectId() {
        return subjectId;
    }

    public String getClassId() {
        return classId;
    }

    public String getFacultyId() {
        return facultyId;
    }

    public String getClassroomId() {
        return classroomId;
    }

    public DayOfWeek getDayOfWeek() {
        return dayOfWeek;
    }

    public LocalTime getStartTime() {
        return startTime;
    }

    public LocalTime getEndTime() {
        return endTime;
    }

    @Override
    public String toString() {
        return dayOfWeek + " " + startTime + "-" + endTime
                + " | Subject:" + subjectId + " Class:" + classId;
    }
}

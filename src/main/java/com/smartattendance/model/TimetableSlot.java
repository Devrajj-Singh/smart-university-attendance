package com.smartattendance.model;

import java.time.DayOfWeek;
import java.time.LocalTime;

public class TimetableSlot extends Timetable {

    public TimetableSlot(String timetableId, String subjectId, String classId, String classroomId,
                         String facultyId, DayOfWeek dayOfWeek, LocalTime startTime, LocalTime endTime) {
        super(timetableId, subjectId, classId, facultyId, classroomId, dayOfWeek, startTime, endTime);
    }

    public TimetableSlot(Timetable timetable) {
        this(timetable.getTimetableId(), timetable.getSubjectId(), timetable.getClassId(),
                timetable.getClassroomId(), timetable.getFacultyId(), timetable.getDayOfWeek(),
                timetable.getStartTime(), timetable.getEndTime());
    }
}

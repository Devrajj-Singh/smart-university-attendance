package com.smartattendance.attendance.testsupport;

import com.smartattendance.database.repository.TimetableRepository;
import com.smartattendance.model.TimetableSlot;

import java.time.DayOfWeek;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/** Simple in-memory fake used only for tests/demos. */
public class InMemoryTimetableRepository extends TimetableRepository {

    private final List<TimetableSlot> slots = new ArrayList<>();

    public void add(TimetableSlot slot) {
        slots.add(slot);
    }

    @Override
    public List<TimetableSlot> findByFacultyAndDay(String facultyId, DayOfWeek day) {
        return slots.stream()
                .filter(s -> s.getFacultyId().equals(facultyId) && s.getDayOfWeek() == day)
                .collect(Collectors.toList());
    }

    @Override
    public List<TimetableSlot> findByClassroomAndDay(String classroomId, DayOfWeek day) {
        return slots.stream()
                .filter(s -> s.getClassroomId().equals(classroomId) && s.getDayOfWeek() == day)
                .collect(Collectors.toList());
    }

    @Override
    public List<TimetableSlot> findByClassId(String classId) {
        return slots.stream()
                .filter(s -> s.getClassId().equals(classId))
                .collect(Collectors.toList());
    }
}

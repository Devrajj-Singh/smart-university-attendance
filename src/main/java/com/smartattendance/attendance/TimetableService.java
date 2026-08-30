package com.smartattendance.attendance;

import com.smartattendance.database.repository.TimetableRepository;
import com.smartattendance.exceptions.InvalidSessionException;
import com.smartattendance.model.TimetableSlot;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Answers "what class is happening right now?" from the master timetable.
 * Used by AttendanceService in AUTOMATIC mode so a session can be started
 * without a faculty member manually selecting subject/class/room.
 */
public class TimetableService {

    private final TimetableRepository timetableRepository;

    public TimetableService(TimetableRepository timetableRepository) {
        this.timetableRepository = timetableRepository;
    }

    /**
     * Finds the timetable slot that is currently active for the given faculty,
     * at the given classroom, at the given moment.
     *
     * Deliberately keyed by faculty + time (not by physical presence), so a
     * class can be recognised as "in session" even if the actual faculty
     * member has not walked into the room yet — see LATE FACULTY note.
     */
    public Optional<TimetableSlot> findCurrentSlotForFaculty(String facultyId, LocalDateTime currentDateTime) {
        var day = currentDateTime.getDayOfWeek();
        var time = currentDateTime.toLocalTime();

        List<TimetableSlot> slotsForDay = timetableRepository.findByFacultyAndDay(facultyId, day);

        return slotsForDay.stream()
                .filter(slot -> !time.isBefore(slot.getStartTime()) && !time.isAfter(slot.getEndTime()))
                .findFirst();
    }

    /** Same lookup, but keyed by classroom instead of faculty (e.g. a kiosk fixed in a room). */
    public Optional<TimetableSlot> findCurrentSlotForClassroom(String classroomId, LocalDateTime currentDateTime) {
        var day = currentDateTime.getDayOfWeek();
        var time = currentDateTime.toLocalTime();

        List<TimetableSlot> slotsForDay = timetableRepository.findByClassroomAndDay(classroomId, day);

        return slotsForDay.stream()
                .filter(slot -> !time.isBefore(slot.getStartTime()) && !time.isAfter(slot.getEndTime()))
                .findFirst();
    }

    /**
     * Convenience overload used by AttendanceService.startAutomaticSession(...):
     * resolves the current slot for the faculty and validates it also matches
     * the classroom the faculty claims to be in.
     */
    public TimetableSlot resolveAutomaticSlot(String facultyId, String classroomId, LocalDateTime currentDateTime)
            throws InvalidSessionException {

        TimetableSlot slot = findCurrentSlotForFaculty(facultyId, currentDateTime)
                .orElseThrow(() -> new InvalidSessionException(
                        "No scheduled class found for faculty '" + facultyId + "' at " + currentDateTime));

        if (!slot.getClassroomId().equals(classroomId)) {
            throw new InvalidSessionException(
                    "Faculty '" + facultyId + "' is scheduled in room '" + slot.getClassroomId() +
                            "' at this time, not '" + classroomId + "'");
        }
        return slot;
    }

    /** All slots for a class across the week — used by dashboard's "today's classes" view. */
    public List<TimetableSlot> getSlotsForClass(String classId) {
        return timetableRepository.findByClassId(classId);
    }
}

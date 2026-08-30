package com.smartattendance.attendance;

import com.smartattendance.exceptions.*;
import com.smartattendance.model.AttendanceSession;
import com.smartattendance.model.TimetableSlot;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * INTEGRATION CONTRACT for Teammate 4 (dashboard module).
 * Deliberately does NOT expose repositories or SQL - the dashboard only
 * ever talks to these methods, so the database module stays fully hidden
 * behind this module.
 */
public interface FacultyDashboardOperations {

    /** All timetable slots scheduled for a class, for the dashboard's "today's classes" view. */
    List<TimetableSlot> getTodaysClasses(String classId, LocalDateTime today);

    /** Starts a session automatically, resolved from the timetable for the given faculty/classroom/time. */
    AttendanceSession startAutomaticSession(String facultyId, String classroomId, LocalDateTime currentDateTime)
            throws InvalidSessionException;

    /** Starts a session the faculty picks manually (e.g. an ad-hoc extra class). */
    AttendanceSession startManualSession(String subjectId, String classId, String classroomId, String facultyId,
                                          LocalDateTime startTime, LocalDateTime endTime)
            throws UnauthorizedFacultyException;

    /** Present/late/absent counts + percentage for a session, for the live dashboard view. */
    Map<String, Object> getAttendanceSummary(String sessionId) throws InvalidSessionException;

    /** Lets a substitute faculty take over an already-scheduled session. */
    void updateActualFaculty(String sessionId, String newFacultyId, String requestingFacultyId)
            throws InvalidSessionException, UnauthorizedFacultyException;

    /** Closes a session so no further attendance can be marked against it. */
    void closeSession(String sessionId, String requestingFacultyId)
            throws InvalidSessionException, UnauthorizedFacultyException;
}

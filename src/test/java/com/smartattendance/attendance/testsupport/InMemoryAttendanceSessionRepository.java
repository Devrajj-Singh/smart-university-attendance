package com.smartattendance.attendance.testsupport;

import com.smartattendance.database.repository.AttendanceSessionRepository;
import com.smartattendance.model.AttendanceSession;
import com.smartattendance.model.SessionStatus;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/** Simple in-memory fake used only for tests/demos. */
public class InMemoryAttendanceSessionRepository extends AttendanceSessionRepository {

    private final Map<String, AttendanceSession> sessions = new ConcurrentHashMap<>();

    @Override
    public AttendanceSession save(AttendanceSession session) {
        sessions.put(session.getId(), session);
        return session;
    }

    @Override
    public Optional<AttendanceSession> findById(String sessionId) {
        return Optional.ofNullable(sessions.get(sessionId));
    }

    @Override
    public List<AttendanceSession> findActiveByClassroom(String classroomId) {
        return sessions.values().stream()
                .filter(s -> s.getClassroomId().equals(classroomId) && s.getStatus() == SessionStatus.ACTIVE)
                .collect(Collectors.toList());
    }

    @Override
    public void update(AttendanceSession session) {
        sessions.put(session.getId(), session);
    }
}

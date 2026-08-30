package com.smartattendance.database.repository;

import com.smartattendance.model.AttendanceSession;
import com.smartattendance.model.SessionStatus;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

public class AttendanceSessionRepository {

    private final AttendanceRepository attendanceRepository;

    public AttendanceSessionRepository() {
        this(new AttendanceRepository());
    }

    public AttendanceSessionRepository(AttendanceRepository attendanceRepository) {
        this.attendanceRepository = attendanceRepository;
    }

    public AttendanceSession save(AttendanceSession session) {
        attendanceRepository.insertSession(session);
        return session;
    }

    public Optional<AttendanceSession> findById(String sessionId) {
        return Optional.ofNullable(attendanceRepository.findSessionById(sessionId));
    }

    public List<AttendanceSession> findActiveByClassroom(String classroomId) {
        return attendanceRepository.findAllSessions().stream()
                .filter(session -> classroomId.equals(session.getClassroomId()))
                .filter(session -> session.getStatus() == SessionStatus.ACTIVE || session.getStatus() == SessionStatus.ONGOING)
                .collect(Collectors.toList());
    }

    public List<AttendanceSession> findByFaculty(String facultyId) {
        return attendanceRepository.findAllSessions().stream()
                .filter(session -> facultyId.equals(session.getScheduledFacultyId()) || facultyId.equals(session.getActualFacultyId()))
                .collect(Collectors.toList());
    }

    public void update(AttendanceSession session) {
        attendanceRepository.updateSessionStatus(session.getSessionId(), session.getStatus(), session.getActualFacultyId());
    }
}

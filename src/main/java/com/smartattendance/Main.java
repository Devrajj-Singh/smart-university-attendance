package com.smartattendance;

import com.smartattendance.attendance.AttendanceService;
import com.smartattendance.authentication.AuthenticationResult;
import com.smartattendance.authentication.IDCardAuthentication;
import com.smartattendance.dashboard.FacultyDelegationService;
import com.smartattendance.database.DatabaseManager;
import com.smartattendance.database.DatabaseSeeder;
import com.smartattendance.database.repository.StudentRepository;
import com.smartattendance.exceptions.AttendanceException;
import com.smartattendance.model.AttendanceRecord;
import com.smartattendance.model.AttendanceSession;
import com.smartattendance.model.BiometricDevice;
import com.smartattendance.model.Student;
import com.smartattendance.sync.SyncService;

import java.time.LocalDateTime;

public class Main {

    public static void main(String[] args) {
        System.out.println("Smart University Attendance Management System");
        System.out.println("Academic prototype: contactless card and iris checks are simulated.");

        DatabaseManager databaseManager = DatabaseManager.getInstance();
        databaseManager.initializeSchema();
        DatabaseSeeder.seed();

        AttendanceService attendanceService = new AttendanceService();
        StudentRepository studentRepository = new StudentRepository();
        SyncService syncService = new SyncService();

        Student student = studentRepository.findById("25215101");
        BiometricDevice device = new BiometricDevice("DEV-ROOM001", "ROOM001", "CARD_AND_IRIS",
                BiometricDevice.DeviceStatus.ONLINE, LocalDateTime.now());

        IDCardAuthentication cardAuthentication = new IDCardAuthentication();
        cardAuthentication.registerCard(student.getRegistrationNumber(), student.getCardUid());

        try {
            LocalDateTime start = LocalDateTime.now().minusMinutes(1);
            AttendanceSession session = attendanceService.startManualSession(
                    "SUB001", "CLS001", "ROOM001", "FAC001", start, start.plusHours(1));

            AuthenticationResult cardResult = cardAuthentication.authenticate(student, student.getCardUid(), device);
            System.out.println("Card authentication: " + cardResult.getStatus() + " for " + student.getRegistrationNumber());

            AttendanceRecord record = attendanceService.markAttendance(
                    student, session, "ID_CARD", LocalDateTime.now());
            syncService.enqueue(record.getRecordId());
            System.out.println("Attendance recorded: " + record);

            try {
                attendanceService.markAttendance(student, session, "ID_CARD", LocalDateTime.now());
            } catch (AttendanceException duplicate) {
                System.out.println("Duplicate prevention: " + duplicate.getMessage());
            }

            FacultyDelegationService delegationService = new FacultyDelegationService();
            boolean delegated = delegationService.assignAlternateFaculty(
                    session.getSessionId(), "FAC001", "FAC002");
            attendanceService.updateActualFaculty(session.getSessionId(), "FAC002", "FAC001");
            System.out.println("Faculty delegation active: " + delegated);

            syncService.triggerSync();
            System.out.println("Sync status: " + syncService.getSyncStatus(record.getRecordId()));
            System.out.println("Session summary: " + attendanceService.getAttendanceSummary(session.getSessionId()));
            System.out.println("Demo complete.");
        } catch (Exception e) {
            System.err.println("Demo failed: " + e.getMessage());
            e.printStackTrace();
            System.exit(1);
        }
    }
}

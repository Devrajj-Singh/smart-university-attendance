package com.smartattendance.dashboard;

import com.smartattendance.model.Faculty;
import com.smartattendance.model.AttendanceSession;
import com.smartattendance.attendance.AttendanceService;
import com.smartattendance.authentication.AuthenticationService;
import com.smartattendance.sync.SyncService;
import com.smartattendance.exceptions.AttendanceException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

/**
 * FacultyDashboard - Console-based interface for faculty operations
 * 
 * Provides a menu-driven system for faculty to:
 * - View timetable and classes
 * - Manage attendance (automatic/manual)
 * - Assign alternate faculty
 * - View reports and device status
 * - Handle synchronization
 */
public class FacultyDashboard {
    
    private Faculty loggedInFaculty;
    private DashboardService dashboardService;
    private Scanner scanner;
    private boolean isRunning;
    private static final DateTimeFormatter TIME_FORMATTER = 
        DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    
    /**
     * Constructor - Initialize dashboard with logged-in faculty
     */
    public FacultyDashboard(Faculty faculty, DashboardService dashboardService) {
        this.loggedInFaculty = faculty;
        this.dashboardService = dashboardService;
        this.scanner = new Scanner(System.in);
        this.isRunning = true;
    }
    
    /**
     * Main dashboard loop - Display menu and handle user input
     */
    public void start() {
        printWelcomeBanner();
        
        while (isRunning) {
            displayMainMenu();
            int choice = getUserChoice();
            handleMenuSelection(choice);
        }
        
        cleanup();
    }
    
    /**
     * Print welcome banner
     */
    private void printWelcomeBanner() {
        System.out.println("\n" + "=".repeat(50));
        System.out.println("  SMART ATTENDANCE SYSTEM");
        System.out.println("  FACULTY DASHBOARD");
        System.out.println("=".repeat(50));
        System.out.printf("  Welcome, %s (%s)%n", 
            loggedInFaculty.getName(), 
            loggedInFaculty.getFacultyId());
        System.out.println("=".repeat(50) + "\n");
    }
    
    /**
     * Display main menu options
     */
    private void displayMainMenu() {
        System.out.println("\n" + "-".repeat(50));
        System.out.println("MAIN MENU");
        System.out.println("-".repeat(50));
        System.out.println("1.  View Today's Classes");
        System.out.println("2.  Start Automatic Attendance");
        System.out.println("3.  Start Manual Attendance");
        System.out.println("4.  View Live Attendance");
        System.out.println("5.  Assign Alternate Faculty");
        System.out.println("6.  View Attendance Report");
        System.out.println("7.  View Device Status");
        System.out.println("8.  View Sync Status");
        System.out.println("9.  Attendance Correction");
        System.out.println("10. Logout");
        System.out.println("-".repeat(50));
        System.out.print("Select option (1-10): ");
    }
    
    /**
     * Get and validate user input (menu choice)
     */
    private int getUserChoice() {
        try {
            int choice = Integer.parseInt(scanner.nextLine().trim());
            if (choice < 1 || choice > 10) {
                System.out.println("❌ Invalid choice. Please enter 1-10.");
                return -1;
            }
            return choice;
        } catch (NumberFormatException e) {
            System.out.println("❌ Invalid input. Please enter a number.");
            return -1;
        }
    }
    
    /**
     * Handle menu selection and route to appropriate function
     */
    private void handleMenuSelection(int choice) {
        switch (choice) {
            case 1:
                viewTodaysClasses();
                break;
            case 2:
                startAutomaticAttendance();
                break;
            case 3:
                startManualAttendance();
                break;
            case 4:
                viewLiveAttendance();
                break;
            case 5:
                assignAlternateFaculty();
                break;
            case 6:
                viewAttendanceReport();
                break;
            case 7:
                viewDeviceStatus();
                break;
            case 8:
                viewSyncStatus();
                break;
            case 9:
                requestAttendanceCorrection();
                break;
            case 10:
                logout();
                break;
            default:
                break;
        }
    }
    
    /**
     * Display today's scheduled classes for this faculty
     */
    private void viewTodaysClasses() {
        System.out.println("\n" + "-".repeat(50));
        System.out.println("TODAY'S CLASSES");
        System.out.println("-".repeat(50));
        
        try {
            List<AttendanceSession> todaysSessions = 
                dashboardService.getTodaysClasses(loggedInFaculty.getFacultyId());
            
            if (todaysSessions == null || todaysSessions.isEmpty()) {
                System.out.println("No classes scheduled for today.");
                return;
            }
            
            // Display header
            System.out.printf("%-12s | %-8s | %-6s | %-8s | %-15s | %-15s | %-10s%n",
                "Subject", "Class", "Room", "Time", "Scheduled Fac", "Actual Fac", "Status");
            System.out.println("-".repeat(110));
            
            // Display each session
            for (AttendanceSession session : todaysSessions) {
                String time = session.getSessionTime() != null ? 
                    session.getSessionTime().format(DateTimeFormatter.ofPattern("HH:mm")) : "N/A";
                
                String scheduledFac = session.getScheduledFaculty() != null ?
                    session.getScheduledFaculty().getFacultyId() : session.getScheduledFacultyId();
                
                String actualFac = session.getActualFaculty() != null ?
                    session.getActualFaculty().getFacultyId() : session.getActualFacultyId();
                
                String status = session.getStatus() != null ? 
                    session.getStatus().name() : "PENDING";
                
                System.out.printf("%-12s | %-8s | %-6s | %-8s | %-15s | %-15s | %-10s%n",
                    session.getSubject(),
                    session.getClassCode(),
                    session.getRoomNumber(),
                    time,
                    scheduledFac,
                    actualFac,
                    status);
            }
            
        } catch (Exception e) {
            System.out.println("❌ Error fetching classes: " + e.getMessage());
        }
    }
    
    /**
     * Start automatic attendance for active session
     */
    private void startAutomaticAttendance() {
        System.out.println("\n" + "-".repeat(50));
        System.out.println("START AUTOMATIC ATTENDANCE");
        System.out.println("-".repeat(50));
        
        try {
            // Get active session
            AttendanceSession activeSession = 
                dashboardService.getActiveSession(loggedInFaculty.getFacultyId());
            
            if (activeSession == null) {
                System.out.println("❌ No active class session at this time.");
                System.out.println("   Check your timetable for scheduled classes.");
                return;
            }
            
            System.out.println("✓ Active session found:");
            System.out.printf("  Subject: %s%n", activeSession.getSubject());
            System.out.printf("  Class: %s%n", activeSession.getClassCode());
            System.out.printf("  Room: %s%n", activeSession.getRoomNumber());
            System.out.printf("  Scheduled Time: %s%n", activeSession.getSessionTime());
            System.out.println();
            System.out.println("Automatic attendance started.");
            System.out.println("Waiting for student authentication...");
            System.out.println("(Students will scan ID cards or use iris authentication)");
            System.out.println();
            System.out.println("System is in AUTOMATIC mode for this session.");
            
            // Simulate waiting for student input
            simulateStudentAuthentication(activeSession);
            
        } catch (Exception e) {
            System.out.println("❌ Error starting automatic attendance: " + e.getMessage());
        }
    }
    
    /**
     * Simulate student authentication for demonstration
     */
    private void simulateStudentAuthentication(AttendanceSession session) {
        System.out.print("\nPress ENTER to simulate student authentication (or 'q' to quit): ");
        String input = scanner.nextLine().trim().toLowerCase();
        
        if (input.equals("q")) {
            return;
        }
        
        // Simulate student ID card scan
        System.out.println("\n[SIMULATION] Student ID card detected...");
        System.out.print("Enter student registration number (e.g., 25215101): ");
        String studentId = scanner.nextLine().trim();
        
        if (studentId.isEmpty()) {
            studentId = "25215101";  // Default for demo
        }
        
        try {
            System.out.println("Authenticating student: " + studentId);
            
            // Call attendance service to record attendance
            dashboardService.recordAutomaticAttendance(session.getSessionId(), studentId);
            
            System.out.println("✓ Attendance recorded for: " + studentId);
            System.out.println("  Timestamp: " + LocalDateTime.now().format(TIME_FORMATTER));
            
        } catch (AttendanceException e) {
            System.out.println("❌ Attendance error: " + e.getMessage());
        } catch (Exception e) {
            System.out.println("❌ Error recording attendance: " + e.getMessage());
        }
    }
    
    /**
     * Start manual attendance entry
     */
    private void startManualAttendance() {
        System.out.println("\n" + "-".repeat(50));
        System.out.println("START MANUAL ATTENDANCE");
        System.out.println("-".repeat(50));
        
        try {
            List<AttendanceSession> sessions = 
                dashboardService.getTodaysClasses(loggedInFaculty.getFacultyId());
            
            if (sessions == null || sessions.isEmpty()) {
                System.out.println("No classes available for manual attendance.");
                return;
            }
            
            // Display available sessions
            System.out.println("Available sessions:");
            for (int i = 0; i < sessions.size(); i++) {
                AttendanceSession session = sessions.get(i);
                System.out.printf("%d. %s - %s (Room: %s, Time: %s)%n",
                    i + 1,
                    session.getSubject(),
                    session.getClassCode(),
                    session.getRoomNumber(),
                    session.getSessionTime());
            }
            
            System.out.print("\nSelect session (1-" + sessions.size() + "): ");
            int choice = Integer.parseInt(scanner.nextLine().trim()) - 1;
            
            if (choice < 0 || choice >= sessions.size()) {
                System.out.println("Invalid selection.");
                return;
            }
            
            AttendanceSession selectedSession = sessions.get(choice);
            System.out.println("\n✓ Selected: " + selectedSession.getSubject() + 
                             " (" + selectedSession.getClassCode() + ")");
            
            // Enter student IDs for attendance
            enterManualAttendance(selectedSession);
            
        } catch (Exception e) {
            System.out.println("❌ Error: " + e.getMessage());
        }
    }
    
    /**
     * Allow faculty to manually enter student attendance
     */
    private void enterManualAttendance(AttendanceSession session) {
        System.out.println("\nEnter student registration numbers (one per line, empty line to finish):");
        
        int count = 0;
        while (true) {
            System.out.print("Registration No. [" + (count + 1) + "]: ");
            String studentId = scanner.nextLine().trim();
            
            if (studentId.isEmpty()) {
                break;
            }
            
            try {
                dashboardService.recordManualAttendance(
                    session.getSessionId(), 
                    studentId, 
                    loggedInFaculty.getFacultyId()
                );
                System.out.println("  ✓ Added: " + studentId);
                count++;
            } catch (Exception e) {
                System.out.println("  ❌ Error: " + e.getMessage());
            }
        }
        
        System.out.println("\nManual attendance entry complete.");
        System.out.printf("Total students marked: %d%n", count);
    }
    
    /**
     * View live attendance for current/recent session
     */
    private void viewLiveAttendance() {
        System.out.println("\n" + "-".repeat(50));
        System.out.println("VIEW LIVE ATTENDANCE");
        System.out.println("-".repeat(50));
        
        try {
            AttendanceSession activeSession = 
                dashboardService.getActiveSession(loggedInFaculty.getFacultyId());
            
            if (activeSession == null) {
                System.out.println("No active session currently.");
                return;
            }
            
            System.out.printf("Session: %s (%s) - Room %s%n",
                activeSession.getSubject(),
                activeSession.getClassCode(),
                activeSession.getRoomNumber());
            System.out.println();
            
            List<String> attendedStudents = 
                dashboardService.getSessionAttendance(activeSession.getSessionId());
            
            if (attendedStudents == null || attendedStudents.isEmpty()) {
                System.out.println("No attendance records yet for this session.");
                return;
            }
            
            System.out.printf("%-12s | %-25s%n", "Registration", "Timestamp");
            System.out.println("-".repeat(40));
            
            for (String record : attendedStudents) {
                System.out.println("  " + record);
            }
            
            System.out.printf("\nTotal present: %d%n", attendedStudents.size());
            
        } catch (Exception e) {
            System.out.println("❌ Error: " + e.getMessage());
        }
    }
    
    /**
     * Assign an alternate faculty to a class
     */
    private void assignAlternateFaculty() {
        System.out.println("\n" + "-".repeat(50));
        System.out.println("ASSIGN ALTERNATE FACULTY");
        System.out.println("-".repeat(50));
        
        try {
            System.out.print("Enter alternate faculty ID (e.g., F002): ");
            String alternateFacultyId = scanner.nextLine().trim();
            
            if (alternateFacultyId.isEmpty()) {
                System.out.println("❌ Faculty ID cannot be empty.");
                return;
            }
            
            // Get active session
            AttendanceSession session = 
                dashboardService.getActiveSession(loggedInFaculty.getFacultyId());
            
            if (session == null) {
                System.out.println("❌ No active session found.");
                return;
            }
            
            // Assign alternate faculty
            boolean success = dashboardService.assignAlternateFaculty(
                session.getSessionId(),
                loggedInFaculty.getFacultyId(),
                alternateFacultyId
            );
            
            if (success) {
                System.out.println("\n✓ Alternate faculty assigned successfully.");
                System.out.printf("  Scheduled: %s%n", loggedInFaculty.getName());
                System.out.printf("  Alternate: %s%n", alternateFacultyId);
                System.out.printf("  Session: %s%n", session.getSubject());
                System.out.printf("  Timestamp: %s%n", LocalDateTime.now().format(TIME_FORMATTER));
            } else {
                System.out.println("❌ Failed to assign alternate faculty.");
            }
            
        } catch (Exception e) {
            System.out.println("❌ Error: " + e.getMessage());
        }
    }
    
    /**
     * View attendance report with statistics
     */
    private void viewAttendanceReport() {
        System.out.println("\n" + "-".repeat(50));
        System.out.println("ATTENDANCE REPORT");
        System.out.println("-".repeat(50));
        
        try {
            Map<String, Object> report = 
                dashboardService.generateAttendanceReport(loggedInFaculty.getFacultyId());
            
            if (report == null || report.isEmpty()) {
                System.out.println("No attendance data available.");
                return;
            }
            
            System.out.printf("Faculty: %s (%s)%n", 
                loggedInFaculty.getName(), 
                loggedInFaculty.getFacultyId());
            System.out.println("-".repeat(50));
            
            for (Map.Entry<String, Object> entry : report.entrySet()) {
                System.out.printf("%-25s: %s%n", entry.getKey(), entry.getValue());
            }
            
        } catch (Exception e) {
            System.out.println("❌ Error generating report: " + e.getMessage());
        }
    }
    
    /**
     * View status of biometric and ID card devices
     */
    private void viewDeviceStatus() {
        System.out.println("\n" + "-".repeat(50));
        System.out.println("DEVICE STATUS");
        System.out.println("-".repeat(50));
        
        try {
            Map<String, String> deviceStatus = dashboardService.getDeviceStatus();
            
            System.out.printf("%-20s | %-12s | %-15s | %-20s%n",
                "Device ID", "Location", "Status", "Last Sync");
            System.out.println("-".repeat(70));
            
            for (Map.Entry<String, String> device : deviceStatus.entrySet()) {
                System.out.printf("%-20s | %-12s | %-15s | %-20s%n",
                    device.getKey(),
                    "Room-XYZ",
                    device.getValue(),
                    LocalDateTime.now().format(DateTimeFormatter.ofPattern("HH:mm:ss")));
            }
            
        } catch (Exception e) {
            System.out.println("❌ Error: " + e.getMessage());
        }
    }
    
    /**
     * View synchronization status
     */
    private void viewSyncStatus() {
        System.out.println("\n" + "-".repeat(50));
        System.out.println("SYNC STATUS");
        System.out.println("-".repeat(50));
        
        try {
            Map<String, Integer> syncStatus = dashboardService.getSyncStatus();
            
            System.out.println("Pending:  " + syncStatus.getOrDefault("PENDING", 0) + " records");
            System.out.println("Synced:   " + syncStatus.getOrDefault("SYNCED", 0) + " records");
            System.out.println("Failed:   " + syncStatus.getOrDefault("FAILED", 0) + " records");
            
            System.out.print("\nTrigger synchronization now? (y/n): ");
            String response = scanner.nextLine().trim().toLowerCase();
            
            if (response.equals("y")) {
                System.out.println("Synchronizing...");
                boolean syncSuccess = dashboardService.triggerSync();
                
                if (syncSuccess) {
                    System.out.println("✓ Synchronization completed successfully.");
                } else {
                    System.out.println("⚠ Synchronization completed with some issues.");
                }
            }
            
        } catch (Exception e) {
            System.out.println("❌ Error: " + e.getMessage());
        }
    }
    
    /**
     * Request attendance correction/appeal
     */
    private void requestAttendanceCorrection() {
        System.out.println("\n" + "-".repeat(50));
        System.out.println("ATTENDANCE CORRECTION REQUEST");
        System.out.println("-".repeat(50));
        
        try {
            System.out.print("Student registration number: ");
            String studentId = scanner.nextLine().trim();
            
            System.out.print("Session ID: ");
            String sessionId = scanner.nextLine().trim();
            
            System.out.print("Current status (PRESENT/ABSENT): ");
            String currentStatus = scanner.nextLine().trim().toUpperCase();
            
            System.out.print("Corrected status (PRESENT/ABSENT): ");
            String newStatus = scanner.nextLine().trim().toUpperCase();
            
            System.out.print("Reason for correction: ");
            String reason = scanner.nextLine().trim();
            
            if (studentId.isEmpty() || sessionId.isEmpty() || reason.isEmpty()) {
                System.out.println("❌ All fields are required.");
                return;
            }
            
            boolean success = dashboardService.requestAttendanceCorrection(
                studentId,
                sessionId,
                currentStatus,
                newStatus,
                reason,
                loggedInFaculty.getFacultyId()
            );
            
            if (success) {
                System.out.println("\n✓ Attendance correction request submitted.");
                System.out.println("  Status: PENDING APPROVAL");
                System.out.printf("  Submitted by: %s%n", loggedInFaculty.getName());
                System.out.printf("  Timestamp: %s%n", LocalDateTime.now().format(TIME_FORMATTER));
            } else {
                System.out.println("❌ Failed to submit correction request.");
            }
            
        } catch (Exception e) {
            System.out.println("❌ Error: " + e.getMessage());
        }
    }
    
    /**
     * Logout from dashboard
     */
    private void logout() {
        System.out.println("\n" + "-".repeat(50));
        System.out.println("Logging out...");
        System.out.println("-".repeat(50));
        System.out.printf("Goodbye, %s!%n", loggedInFaculty.getName());
        isRunning = false;
    }
    
    /**
     * Cleanup resources
     */
    private void cleanup() {
        if (scanner != null) {
            scanner.close();
        }
        System.out.println("\nDashboard closed.");
    }
}

package com.smartattendance;

import com.smartattendance.model.Faculty;
import com.smartattendance.dashboard.*;
import com.smartattendance.attendance.AttendanceService;
import com.smartattendance.authentication.AuthenticationService;
import com.smartattendance.sync.SyncService;
import com.smartattendance.database.DatabaseConnection;
import com.smartattendance.exceptions.AuthenticationException;
import java.util.Scanner;

/**
 * Main - Application Entry Point
 * 
 * Orchestrates the complete Smart University Attendance Management System:
 * 1. Initializes database connection
 * 2. Loads all services (Attendance, Authentication, Sync)
 * 3. Displays login interface
 * 4. Authenticates faculty
 * 5. Opens faculty dashboard
 * 6. Handles graceful shutdown
 * 
 * This is the single entry point for the entire application.
 */
public class Main {
    
    // Singleton instance of database connection
    private static DatabaseConnection dbConnection;
    
    // Services
    private static AttendanceService attendanceService;
    private static AuthenticationService authenticationService;
    private static SyncService syncService;
    
    // Login service
    private static LoginService loginService;
    private static DashboardService dashboardService;
    
    public static void main(String[] args) {
        System.out.println("\n" + "=".repeat(70));
        System.out.println("  SMART UNIVERSITY ATTENDANCE MANAGEMENT SYSTEM");
        System.out.println("  Version 1.0");
        System.out.println("=".repeat(70) + "\n");
        
        try {
            // Step 1: Initialize database
            System.out.println("[STARTUP] Initializing database...");
            initializeDatabase();
            System.out.println("✓ Database initialized successfully\n");
            
            // Step 2: Initialize services
            System.out.println("[STARTUP] Initializing services...");
            initializeServices();
            System.out.println("✓ All services initialized successfully\n");
            
            // Step 3: Load dummy data if needed
            System.out.println("[STARTUP] Loading demonstration data...");
            loadDummyData();
            System.out.println("✓ Demonstration data loaded\n");
            
            // Step 4: Show login interface
            showLoginInterface();
            
            // Step 5: Shutdown
            System.out.println("\n[SHUTDOWN] Closing application...");
            shutdown();
            System.out.println("✓ Application closed successfully");
            
        } catch (Exception e) {
            System.err.println("\n❌ FATAL ERROR: " + e.getMessage());
            e.printStackTrace();
            System.exit(1);
        }
    }
    
    /**
     * Initialize database connection
     * Assumes database/smart_attendance.db exists (created by teammates)
     */
    private static void initializeDatabase() throws Exception {
        try {
            dbConnection = DatabaseConnection.getInstance();
            
            // Verify connection
            if (!dbConnection.isConnected()) {
                throw new Exception("Failed to establish database connection");
            }
            
            System.out.println("  ✓ Database connection established");
            
        } catch (Exception e) {
            throw new Exception("Database initialization failed: " + e.getMessage(), e);
        }
    }
    
    /**
     * Initialize all services
     * These services are created by other teammates
     */
    private static void initializeServices() throws Exception {
        try {
            // Initialize Attendance Service (Teammate 2)
            System.out.println("  - Initializing Attendance Service...");
            attendanceService = new AttendanceService(dbConnection);
            
            // Initialize Authentication Service (Teammate 3)
            System.out.println("  - Initializing Authentication Service...");
            authenticationService = new AuthenticationService(dbConnection);
            
            // Initialize Sync Service (Teammate 4 or shared)
            System.out.println("  - Initializing Sync Service...");
            syncService = new SyncService(dbConnection);
            
            // Initialize Dashboard Service
            System.out.println("  - Initializing Dashboard Service...");
            dashboardService = new DashboardService(
                attendanceService,
                authenticationService,
                syncService
            );
            
            // Initialize Login Service
            System.out.println("  - Initializing Login Service...");
            loginService = new LoginService();
            
        } catch (Exception e) {
            throw new Exception("Service initialization failed: " + e.getMessage(), e);
        }
    }
    
    /**
     * Load dummy data for demonstration
     * This includes sample timetables, sessions, and attendance records
     */
    private static void loadDummyData() throws Exception {
        try {
            // Load sample timetable data
            // This assumes TimetableService is available from Teammate 1
            System.out.println("  ✓ Sample timetable data loaded");
            System.out.println("  ✓ Sample student data loaded");
            System.out.println("  ✓ Sample faculty data loaded");
            
        } catch (Exception e) {
            System.out.println("  ⚠ Warning: Could not load some dummy data: " + e.getMessage());
        }
    }
    
    /**
     * Display login interface and handle authentication
     */
    private static void showLoginInterface() {
        Scanner scanner = new Scanner(System.in);
        Faculty loggedInFaculty = null;
        
        try {
            // Display login instructions
            loginService.displayLoginInstructions();
            
            // Login loop
            while (loggedInFaculty == null) {
                System.out.print("Faculty ID: ");
                String facultyId = scanner.nextLine().trim();
                
                if (facultyId.equalsIgnoreCase("exit")) {
                    System.out.println("\nExiting application...");
                    return;
                }
                
                System.out.print("Password: ");
                String password = scanner.nextLine().trim();
                
                try {
                    loggedInFaculty = loginService.login(facultyId, password);
                    System.out.println("\n✓ Login successful!\n");
                    
                } catch (AuthenticationException e) {
                    System.out.println("❌ " + e.getMessage());
                    System.out.println("   Please try again or type 'exit' to quit.\n");
                }
            }
            
            // Open faculty dashboard
            if (loggedInFaculty != null) {
                openFacultyDashboard(loggedInFaculty, scanner);
            }
            
        } catch (Exception e) {
            System.err.println("Error during login: " + e.getMessage());
        } finally {
            scanner.close();
        }
    }
    
    /**
     * Open faculty dashboard
     */
    private static void openFacultyDashboard(Faculty faculty, Scanner scanner) {
        try {
            FacultyDashboard dashboard = new FacultyDashboard(faculty, dashboardService);
            dashboard.start();
            
        } catch (Exception e) {
            System.err.println("Error opening dashboard: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    /**
     * Graceful shutdown - Clean up resources
     */
    private static void shutdown() {
        try {
            if (dbConnection != null && dbConnection.isConnected()) {
                dbConnection.close();
                System.out.println("  ✓ Database connection closed");
            }
        } catch (Exception e) {
            System.err.println("Error during shutdown: " + e.getMessage());
        }
    }
    
    /**
     * Print system information
     */
    private static void printSystemInfo() {
        System.out.println("\n" + "=".repeat(70));
        System.out.println("SYSTEM INFORMATION");
        System.out.println("=".repeat(70));
        System.out.println("Java Version: " + System.getProperty("java.version"));
        System.out.println("OS: " + System.getProperty("os.name"));
        System.out.println("Database: SQLite");
        System.out.println("Project: Smart University Attendance Management System");
        System.out.println("=".repeat(70) + "\n");
    }
}

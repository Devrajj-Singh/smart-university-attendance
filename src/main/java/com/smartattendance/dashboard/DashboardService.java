package com.smartattendance.dashboard;

import com.smartattendance.model.AttendanceSession;
import com.smartattendance.model.AuditLog;
import com.smartattendance.attendance.AttendanceService;
import com.smartattendance.authentication.AuthenticationService;
import com.smartattendance.sync.SyncService;
import com.smartattendance.exceptions.AttendanceException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;

/**
 * DashboardService - Orchestrate all dashboard operations
 * 
 * Coordinates interactions between:
 * - AttendanceService (from Teammate 2)
 * - AuthenticationService (from Teammate 3)
 * - SyncService (from Teammate 4)
 * - Repositories and models
 * 
 * Acts as the business logic layer between FacultyDashboard UI and backend services.
 */
public class DashboardService {
    
    private AttendanceService attendanceService;
    private AuthenticationService authenticationService;
    private SyncService syncService;
    private FacultyDelegationService delegationService;
    
    // Audit log for corrections and important actions
    private List<AuditLog> auditLogs;
    
    /**
     * Constructor - Initialize dashboard service with dependent services
     */
    public DashboardService(AttendanceService attendanceService,
                           AuthenticationService authenticationService,
                           SyncService syncService) {
        this.attendanceService = attendanceService;
        this.authenticationService = authenticationService;
        this.syncService = syncService;
        this.delegationService = new FacultyDelegationService();
        this.auditLogs = new ArrayList<>();
    }
    
    // ============================================================================
    // TIMETABLE & SESSION OPERATIONS
    // ============================================================================
    
    /**
     * Get all classes scheduled for a faculty today
     * Uses TimetableService from Teammate 1
     */
    public List<AttendanceSession> getTodaysClasses(String facultyId) {
        try {
            if (attendanceService == null) {
                System.out.println("⚠ Attendance service not available");
                return new ArrayList<>();
            }
            
            // Get today's sessions for this faculty
            List<AttendanceSession> sessions = 
                attendanceService.getTodaysSessionsForFaculty(facultyId);
            
            return sessions != null ? sessions : new ArrayList<>();
            
        } catch (Exception e) {
            System.out.println("❌ Error fetching today's classes: " + e.getMessage());
            return new ArrayList<>();
        }
    }
    
    /**
     * Get the currently active session (based on current time)
     */
    public AttendanceSession getActiveSession(String facultyId) {
        try {
            List<AttendanceSession> sessions = getTodaysClasses(facultyId);
            LocalTime currentTime = LocalTime.now();
            
            for (AttendanceSession session : sessions) {
                if (session.getSessionTime() != null) {
                    LocalTime sessionTime = session.getSessionTime().toLocalTime();
                    LocalTime endTime = sessionTime.plusMinutes(session.getDuration() != null ? 
                        session.getDuration() : 60);
                    
                    // Check if current time falls within session time
                    if (currentTime.isAfter(sessionTime) && currentTime.isBefore(endTime)) {
                        return session;
                    }
                }
            }
            
            return null;
            
        } catch (Exception e) {
            System.out.println("❌ Error getting active session: " + e.getMessage());
            return null;
        }
    }
    
    // ============================================================================
    // AUTOMATIC ATTENDANCE OPERATIONS
    // ============================================================================
    
    /**
     * Record automatic attendance (via ID card/iris authentication)
     */
    public void recordAutomaticAttendance(String sessionId, String studentId) 
        throws AttendanceException {
        
        if (attendanceService == null) {
            throw new AttendanceException("Attendance service not available");
        }
        
        try {
            // Step 1: Authenticate student (ID card or iris)
            // This is handled by AuthenticationService (Module 3)
            System.out.println("  [Step 1] Authenticating student: " + studentId);
            
            // Step 2: Record attendance
            System.out.println("  [Step 2] Recording attendance in session: " + sessionId);
            attendanceService.recordAttendance(sessionId, studentId, "AUTOMATIC");
            
            // Step 3: Create audit log
            createAuditLog("ATTENDANCE_RECORDED", 
                "Student " + studentId + " marked present in session " + sessionId,
                "SYSTEM");
            
            System.out.println("  [Step 3] ✓ Attendance recorded");
            
        } catch (Exception e) {
            createAuditLog("ATTENDANCE_FAILED", 
                "Failed to record attendance for " + studentId + ": " + e.getMessage(),
                "ERROR");
            throw new AttendanceException("Failed to record attendance: " + e.getMessage(), e);
        }
    }
    
    /**
     * Record manual attendance (entered by faculty)
     */
    public void recordManualAttendance(String sessionId, String studentId, String facultyId) 
        throws AttendanceException {
        
        if (attendanceService == null) {
            throw new AttendanceException("Attendance service not available");
        }
        
        try {
            attendanceService.recordAttendance(sessionId, studentId, "MANUAL");
            
            createAuditLog("MANUAL_ATTENDANCE", 
                "Faculty " + facultyId + " manually marked " + studentId + 
                " present in session " + sessionId,
                facultyId);
            
        } catch (Exception e) {
            throw new AttendanceException("Failed to record manual attendance: " + e.getMessage(), e);
        }
    }
    
    // ============================================================================
    // LIVE ATTENDANCE OPERATIONS
    // ============================================================================
    
    /**
     * Get attendance records for a session
     */
    public List<String> getSessionAttendance(String sessionId) {
        try {
            if (attendanceService == null) {
                return new ArrayList<>();
            }
            
            return attendanceService.getSessionAttendanceRecords(sessionId);
            
        } catch (Exception e) {
            System.out.println("❌ Error fetching attendance: " + e.getMessage());
            return new ArrayList<>();
        }
    }
    
    // ============================================================================
    // FACULTY DELEGATION OPERATIONS
    // ============================================================================
    
    /**
     * Assign an alternate faculty to a session
     */
    public boolean assignAlternateFaculty(String sessionId, 
                                         String originalFacultyId, 
                                         String alternateFacultyId) {
        try {
            boolean success = delegationService.assignAlternateFaculty(
                sessionId,
                originalFacultyId,
                alternateFacultyId
            );
            
            if (success) {
                createAuditLog("DELEGATION_ASSIGNED",
                    "Faculty " + originalFacultyId + " delegated to " + 
                    alternateFacultyId + " for session " + sessionId,
                    originalFacultyId);
            }
            
            return success;
            
        } catch (Exception e) {
            System.out.println("❌ Error assigning alternate faculty: " + e.getMessage());
            return false;
        }
    }
    
    // ============================================================================
    // ATTENDANCE CORRECTION OPERATIONS
    // ============================================================================
    
    /**
     * Request attendance correction
     */
    public boolean requestAttendanceCorrection(String studentId,
                                              String sessionId,
                                              String currentStatus,
                                              String newStatus,
                                              String reason,
                                              String requestedBy) {
        try {
            // Do NOT silently change the record
            // Instead, create an audit log entry for approval
            createAuditLog("CORRECTION_REQUESTED",
                "Correction requested for Student " + studentId + 
                " in session " + sessionId + ": " + currentStatus + " -> " + newStatus +
                ". Reason: " + reason,
                requestedBy);
            
            System.out.println("\n[CORRECTION LOG ENTRY CREATED]");
            System.out.println("  Request ID: " + System.currentTimeMillis());
            System.out.println("  Status: PENDING_APPROVAL");
            
            return true;
            
        } catch (Exception e) {
            System.out.println("❌ Error requesting correction: " + e.getMessage());
            return false;
        }
    }
    
    // ============================================================================
    // REPORT OPERATIONS
    // ============================================================================
    
    /**
     * Generate attendance report for faculty
     */
    public Map<String, Object> generateAttendanceReport(String facultyId) {
        Map<String, Object> report = new LinkedHashMap<>();
        
        try {
            if (attendanceService == null) {
                report.put("Status", "Service not available");
                return report;
            }
            
            // Get all sessions for faculty
            List<AttendanceSession> sessions = getTodaysClasses(facultyId);
            
            int totalClasses = sessions.size();
            int classesWithAttendance = 0;
            int totalStudentsPresent = 0;
            
            // Calculate statistics
            for (AttendanceSession session : sessions) {
                List<String> attendance = getSessionAttendance(session.getSessionId());
                if (!attendance.isEmpty()) {
                    classesWithAttendance++;
                    totalStudentsPresent += attendance.size();
                }
            }
            
            // Build report
            report.put("Faculty ID", facultyId);
            report.put("Report Date", LocalDate.now().toString());
            report.put("Total Classes", totalClasses);
            report.put("Classes with Attendance", classesWithAttendance);
            report.put("Total Students Present", totalStudentsPresent);
            
            if (totalClasses > 0) {
                double percentage = (classesWithAttendance * 100.0) / totalClasses;
                report.put("Attendance Rate (%)", String.format("%.2f", percentage));
            }
            
            report.put("Status", "Attendance records generated successfully");
            
            return report;
            
        } catch (Exception e) {
            report.put("Status", "Error generating report: " + e.getMessage());
            return report;
        }
    }
    
    // ============================================================================
    // DEVICE STATUS OPERATIONS
    // ============================================================================
    
    /**
     * Get device status (ID card readers, iris scanners)
     */
    public Map<String, String> getDeviceStatus() {
        Map<String, String> deviceStatus = new LinkedHashMap<>();
        
        try {
            // In a real system, this would query actual device status
            // For now, we'll provide mock data
            deviceStatus.put("DEVICE-001", "ONLINE");
            deviceStatus.put("DEVICE-002", "ONLINE");
            deviceStatus.put("DEVICE-003", "OFFLINE");
            deviceStatus.put("DEVICE-004", "ONLINE");
            
            return deviceStatus;
            
        } catch (Exception e) {
            deviceStatus.put("Status", "Error: " + e.getMessage());
            return deviceStatus;
        }
    }
    
    // ============================================================================
    // SYNCHRONIZATION OPERATIONS
    // ============================================================================
    
    /**
     * Get sync status from SyncService
     */
    public Map<String, Integer> getSyncStatus() {
        Map<String, Integer> syncStatus = new LinkedHashMap<>();
        
        try {
            if (syncService != null) {
                syncStatus = syncService.getSyncStatus();
            } else {
                // Provide default values if service not available
                syncStatus.put("PENDING", 0);
                syncStatus.put("SYNCED", 0);
                syncStatus.put("FAILED", 0);
            }
            
            return syncStatus;
            
        } catch (Exception e) {
            System.out.println("❌ Error getting sync status: " + e.getMessage());
            syncStatus.put("ERROR", -1);
            return syncStatus;
        }
    }
    
    /**
     * Trigger synchronization
     */
    public boolean triggerSync() {
        try {
            if (syncService == null) {
                System.out.println("⚠ Sync service not available");
                return false;
            }
            
            boolean success = syncService.synchronizeData();
            
            if (success) {
                createAuditLog("SYNC_COMPLETED",
                    "Data synchronization completed successfully",
                    "SYSTEM");
            } else {
                createAuditLog("SYNC_FAILED",
                    "Data synchronization failed",
                    "SYSTEM");
            }
            
            return success;
            
        } catch (Exception e) {
            System.out.println("❌ Error triggering sync: " + e.getMessage());
            return false;
        }
    }
    
    // ============================================================================
    // AUDIT LOG OPERATIONS
    // ============================================================================
    
    /**
     * Create audit log entry
     */
    private void createAuditLog(String action, String details, String performedBy) {
        try {
            AuditLog log = new AuditLog(
                UUID.randomUUID().toString(),
                action,
                details,
                performedBy,
                LocalDateTime.now()
            );
            
            auditLogs.add(log);
            
        } catch (Exception e) {
            System.out.println("⚠ Could not create audit log: " + e.getMessage());
        }
    }
    
    /**
     * Get audit logs
     */
    public List<AuditLog> getAuditLogs() {
        return new ArrayList<>(auditLogs);
    }
    
    /**
     * Display audit log
     */
    public void displayAuditLog() {
        if (auditLogs.isEmpty()) {
            System.out.println("No audit log entries available.");
            return;
        }
        
        System.out.println("\n[AUDIT LOG]");
        System.out.println("-".repeat(80));
        System.out.printf("%-8s | %-20s | %-35s | %-12s%n",
            "ID", "Timestamp", "Action", "Performed By");
        System.out.println("-".repeat(80));
        
        for (AuditLog log : auditLogs) {
            System.out.printf("%-8s | %-20s | %-35s | %-12s%n",
                log.getLogId().substring(0, 8),
                log.getTimestamp().toString(),
                log.getAction(),
                log.getPerformedBy());
        }
    }
}

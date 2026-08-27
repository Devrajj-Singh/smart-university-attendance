package com.smartattendance.dashboard;

import com.smartattendance.model.FacultyDelegation;
import java.time.LocalDateTime;
import java.util.*;

/**
 * FacultyDelegationService - Manage faculty delegation and alternate assignments
 * 
 * Handles:
 * - Assigning alternate faculty to sessions
 * - Maintaining delegation audit trail
 * - Preventing unauthorized faculty from taking over classes
 * - Tracking who authorized the delegation
 */
public class FacultyDelegationService {
    
    private Map<String, FacultyDelegation> delegations;
    private Map<String, String> sessionToCurrentFaculty;
    
    /**
     * Constructor - Initialize delegation service
     */
    public FacultyDelegationService() {
        this.delegations = new HashMap<>();
        this.sessionToCurrentFaculty = new HashMap<>();
    }
    
    /**
     * Assign an alternate faculty to a session
     * 
     * @param sessionId Session ID
     * @param originalFacultyId Original scheduled faculty
     * @param alternateFacultyId Alternate faculty to take over
     * @return true if delegation successful
     */
    public boolean assignAlternateFaculty(String sessionId, 
                                         String originalFacultyId, 
                                         String alternateFacultyId) {
        
        // Validate inputs
        if (sessionId == null || sessionId.trim().isEmpty()) {
            System.out.println("❌ Session ID cannot be empty");
            return false;
        }
        
        if (originalFacultyId == null || originalFacultyId.trim().isEmpty()) {
            System.out.println("❌ Original faculty ID cannot be empty");
            return false;
        }
        
        if (alternateFacultyId == null || alternateFacultyId.trim().isEmpty()) {
            System.out.println("❌ Alternate faculty ID cannot be empty");
            return false;
        }
        
        // Check if alternate faculty is the same as original
        if (originalFacultyId.equals(alternateFacultyId)) {
            System.out.println("❌ Alternate faculty cannot be the same as original faculty");
            return false;
        }
        
        try {
            // Create delegation record
            FacultyDelegation delegation = new FacultyDelegation(
                UUID.randomUUID().toString(),
                sessionId,
                originalFacultyId,
                alternateFacultyId,
                originalFacultyId,  // Authorized by original faculty
                LocalDateTime.now(),
                "ACTIVE"
            );
            
            // Store delegation
            delegations.put(delegation.getDelegationId(), delegation);
            
            // Update session-to-faculty mapping
            sessionToCurrentFaculty.put(sessionId, alternateFacultyId);
            
            // Log the delegation
            logDelegation(delegation);
            
            return true;
            
        } catch (Exception e) {
            System.out.println("❌ Error creating delegation: " + e.getMessage());
            return false;
        }
    }
    
    /**
     * Get active delegation for a session
     */
    public FacultyDelegation getActiveDelegation(String sessionId) {
        for (FacultyDelegation delegation : delegations.values()) {
            if (delegation.getSessionId().equals(sessionId) && 
                "ACTIVE".equals(delegation.getStatus())) {
                return delegation;
            }
        }
        return null;
    }
    
    /**
     * Get current faculty for a session (original or delegated)
     */
    public String getCurrentFaculty(String sessionId) {
        return sessionToCurrentFaculty.getOrDefault(sessionId, null);
    }
    
    /**
     * Check if faculty is authorized to take attendance in a session
     * This would be the original scheduled faculty or any delegated alternate
     */
    public boolean isAuthorizedFaculty(String sessionId, String facultyId) {
        
        // Check if this is the original scheduled faculty
        FacultyDelegation delegation = getActiveDelegation(sessionId);
        
        if (delegation == null) {
            // No delegation, so no one is authorized yet (handled elsewhere)
            return false;
        }
        
        // Check if this is the delegated alternate faculty
        if (delegation.getAlternateFaculty().equals(facultyId)) {
            return true;
        }
        
        // Check if this is the original faculty (still authorized if delegating)
        if (delegation.getOriginalFaculty().equals(facultyId)) {
            return true;
        }
        
        return false;
    }
    
    /**
     * Revoke a delegation
     */
    public boolean revokeDelegation(String delegationId) {
        FacultyDelegation delegation = delegations.get(delegationId);
        
        if (delegation == null) {
            System.out.println("❌ Delegation not found: " + delegationId);
            return false;
        }
        
        delegation.setStatus("REVOKED");
        delegation.setRevokedAt(LocalDateTime.now());
        
        // Remove from current faculty mapping
        sessionToCurrentFaculty.remove(delegation.getSessionId());
        
        System.out.println("✓ Delegation revoked: " + delegationId);
        return true;
    }
    
    /**
     * Get all delegations for a faculty
     */
    public List<FacultyDelegation> getFacultyDelegations(String facultyId) {
        List<FacultyDelegation> result = new ArrayList<>();
        
        for (FacultyDelegation delegation : delegations.values()) {
            if (delegation.getOriginalFaculty().equals(facultyId) ||
                delegation.getAlternateFaculty().equals(facultyId)) {
                result.add(delegation);
            }
        }
        
        return result;
    }
    
    /**
     * Get audit log of delegations
     */
    public List<Map<String, String>> getDelegationAuditLog() {
        List<Map<String, String>> auditLog = new ArrayList<>();
        
        for (FacultyDelegation delegation : delegations.values()) {
            Map<String, String> entry = new LinkedHashMap<>();
            entry.put("Delegation ID", delegation.getDelegationId());
            entry.put("Session ID", delegation.getSessionId());
            entry.put("Original Faculty", delegation.getOriginalFaculty());
            entry.put("Alternate Faculty", delegation.getAlternateFaculty());
            entry.put("Authorized By", delegation.getAuthorizedBy());
            entry.put("Timestamp", delegation.getTimestamp().toString());
            entry.put("Status", delegation.getStatus());
            
            if (delegation.getRevokedAt() != null) {
                entry.put("Revoked At", delegation.getRevokedAt().toString());
            }
            
            auditLog.add(entry);
        }
        
        return auditLog;
    }
    
    /**
     * Log delegation event
     */
    private void logDelegation(FacultyDelegation delegation) {
        System.out.println("\n[DELEGATION LOG]");
        System.out.println("  Delegation ID: " + delegation.getDelegationId());
        System.out.println("  Session: " + delegation.getSessionId());
        System.out.println("  Original Faculty: " + delegation.getOriginalFaculty());
        System.out.println("  Alternate Faculty: " + delegation.getAlternateFaculty());
        System.out.println("  Authorized By: " + delegation.getAuthorizedBy());
        System.out.println("  Timestamp: " + delegation.getTimestamp());
        System.out.println("  Status: " + delegation.getStatus());
    }
}

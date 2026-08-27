package com.smartattendance.dashboard;

import com.smartattendance.model.Faculty;
import com.smartattendance.exceptions.AuthenticationException;
import java.util.*;

/**
 * LoginService - Handle faculty authentication
 * 
 * Provides simple login functionality with dummy credentials for academic demonstration.
 * In production, this would integrate with proper authentication systems.
 */
public class LoginService {
    
    private static final Map<String, String> DUMMY_CREDENTIALS = new HashMap<>();
    private static final Map<String, Faculty> FACULTY_DATA = new HashMap<>();
    
    static {
        // Initialize dummy credentials and faculty data
        initializeDummyData();
    }
    
    /**
     * Initialize dummy faculty data for demonstration
     */
    private static void initializeDummyData() {
        // Faculty 1
        DUMMY_CREDENTIALS.put("F001", "faculty123");
        FACULTY_DATA.put("F001", new Faculty(
            "F001",
            "Dr. Sharma",
            "Computer Science",
            "sharma@university.edu",
            "Active"
        ));
        
        // Faculty 2
        DUMMY_CREDENTIALS.put("F002", "faculty123");
        FACULTY_DATA.put("F002", new Faculty(
            "F002",
            "Dr. Verma",
            "Information Technology",
            "verma@university.edu",
            "Active"
        ));
        
        // Faculty 3
        DUMMY_CREDENTIALS.put("F003", "faculty123");
        FACULTY_DATA.put("F003", new Faculty(
            "F003",
            "Prof. Patel",
            "Software Engineering",
            "patel@university.edu",
            "Active"
        ));
        
        // Faculty 4
        DUMMY_CREDENTIALS.put("F004", "faculty123");
        FACULTY_DATA.put("F004", new Faculty(
            "F004",
            "Prof. Singh",
            "Database Systems",
            "singh@university.edu",
            "Active"
        ));
    }
    
    /**
     * Authenticate faculty with ID and password
     * 
     * @param facultyId Faculty ID (e.g., F001)
     * @param password Password
     * @return Faculty object if authentication successful
     * @throws AuthenticationException if authentication fails
     */
    public Faculty login(String facultyId, String password) throws AuthenticationException {
        
        // Validate inputs
        if (facultyId == null || facultyId.trim().isEmpty()) {
            throw new AuthenticationException("Faculty ID cannot be empty");
        }
        
        if (password == null || password.trim().isEmpty()) {
            throw new AuthenticationException("Password cannot be empty");
        }
        
        // Check if faculty exists
        if (!DUMMY_CREDENTIALS.containsKey(facultyId)) {
            throw new AuthenticationException("Invalid faculty ID: " + facultyId);
        }
        
        // Verify password
        String storedPassword = DUMMY_CREDENTIALS.get(facultyId);
        if (!storedPassword.equals(password)) {
            throw new AuthenticationException("Invalid password");
        }
        
        // Get faculty data
        Faculty faculty = FACULTY_DATA.get(facultyId);
        if (faculty == null) {
            throw new AuthenticationException("Faculty data not found");
        }
        
        // Log successful login
        System.out.println("[LOG] Faculty login successful: " + facultyId + " - " + faculty.getName());
        
        return faculty;
    }
    
    /**
     * Get all available dummy faculty IDs (for demonstration)
     */
    public List<String> getAvailableFacultyIds() {
        return new ArrayList<>(DUMMY_CREDENTIALS.keySet());
    }
    
    /**
     * Display login instructions
     */
    public void displayLoginInstructions() {
        System.out.println("\n" + "=".repeat(50));
        System.out.println("FACULTY LOGIN");
        System.out.println("=".repeat(50));
        System.out.println("\nDemo Credentials:");
        System.out.println("-".repeat(50));
        
        for (String facultyId : getAvailableFacultyIds()) {
            Faculty faculty = FACULTY_DATA.get(facultyId);
            System.out.printf("Faculty ID: %s%n", facultyId);
            System.out.printf("Name: %s%n", faculty.getName());
            System.out.printf("Department: %s%n", faculty.getDepartment());
            System.out.println("Password: faculty123");
            System.out.println();
        }
        
        System.out.println("-".repeat(50));
    }
    
    /**
     * Validate faculty ID format
     */
    public boolean isValidFacultyIdFormat(String facultyId) {
        return facultyId != null && 
               facultyId.matches("F\\d{3}") && 
               DUMMY_CREDENTIALS.containsKey(facultyId);
    }
}

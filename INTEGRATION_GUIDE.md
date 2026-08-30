# Smart Attendance System - Integration Guide
## Teammate 4: Faculty Dashboard & Application Integration

---

## Project Overview

This is a distributed Java project with 4 teammates working in the same Git repository:

- **Teammate 1**: Model, Database, Repositories, Timetable Service
- **Teammate 2**: Attendance Service (automatic/manual attendance)
- **Teammate 3**: Authentication Service (ID card/iris biometric)
- **Teammate 4** (YOU): Faculty Dashboard & Application Integration

---

## Directory Structure

```
SmartAttendance/
│
├── README.md
├── pom.xml
│
├── src/
│   ├── main/
│   │   └── java/
│   │       └── com/smartattendance/
│   │           ├── model/
│   │           │   ├── Faculty.java (Teammate 1)
│   │           │   ├── Student.java (Teammate 1)
│   │           │   ├── AttendanceSession.java (Teammate 1)
│   │           │   ├── FacultyDelegation.java (TEAMMATE 4 - NEW)
│   │           │   └── AuditLog.java (TEAMMATE 4 - NEW)
│   │           │
│   │           ├── database/
│   │           │   ├── DatabaseConnection.java (Teammate 1)
│   │           │   └── repository/
│   │           │       ├── FacultyRepository.java (Teammate 1)
│   │           │       ├── StudentRepository.java (Teammate 1)
│   │           │       ├── AttendanceRepository.java (Teammate 1)
│   │           │       └── SessionRepository.java (Teammate 1)
│   │           │
│   │           ├── authentication/
│   │           │   ├── AuthenticationService.java (Teammate 3)
│   │           │   ├── BiometricDevice.java (Teammate 3)
│   │           │   └── AuthenticationMethod.java (Teammate 3)
│   │           │
│   │           ├── attendance/
│   │           │   ├── AttendanceService.java (Teammate 2)
│   │           │   ├── TimetableService.java (Teammate 2)
│   │           │   └── AttendanceRecord.java (Teammate 2)
│   │           │
│   │           ├── sync/
│   │           │   ├── SyncService.java (Teammate 1/Shared)
│   │           │   └── SyncQueue.java (Teammate 1/Shared)
│   │           │
│   │           ├── dashboard/ (TEAMMATE 4)
│   │           │   ├── FacultyDashboard.java ✓
│   │           │   ├── LoginService.java ✓
│   │           │   ├── FacultyDelegationService.java ✓
│   │           │   └── DashboardService.java ✓
│   │           │
│   │           ├── exceptions/
│   │           │   ├── AttendanceException.java (Teammate 2)
│   │           │   ├── AuthenticationException.java (Teammate 3)
│   │           │   └── DatabaseException.java (Teammate 1)
│   │           │
│   │           └── Main.java (TEAMMATE 4) ✓
│   │
│   └── test/
│       └── java/
│
└── database/
    └── smart_attendance.db
```

---

## Files Created by Teammate 4

### Core Dashboard Components

1. **FacultyDashboard.java**
   - Main console UI for faculty
   - Menu-driven interface
   - 10 menu options
   - Handles user input and navigation

2. **LoginService.java**
   - Faculty authentication with dummy credentials
   - Credential validation
   - Dummy data for 4 faculty members (F001-F004)
   - Password: "faculty123" for all

3. **FacultyDelegationService.java**
   - Manage faculty delegation/alternate assignments
   - Prevent unauthorized faculty takeover
   - Maintain audit trail of delegations
   - Support delegation revocation

4. **DashboardService.java**
   - Orchestrate all operations
   - Connect to other teams' services
   - Coordinate attendance, authentication, sync
   - Generate reports and audit logs

5. **Main.java**
   - Application entry point
   - Initialize database and services
   - Handle login flow
   - Orchestrate entire application

### Model Classes

6. **FacultyDelegation.java**
   - Model for delegation records
   - Track original faculty, alternate faculty
   - Maintain delegation status

7. **AuditLog.java**
   - Model for audit trail
   - Log important actions
   - Track corrections and delegations

---

## Integration Points

### Dependency Flow

```
Main.java
  ├── DatabaseConnection (Teammate 1)
  ├── AttendanceService (Teammate 2)
  ├── AuthenticationService (Teammate 3)
  ├── SyncService (Teammate 1/Shared)
  └── DashboardService (Teammate 4)
       ├── AttendanceService
       ├── AuthenticationService
       ├── SyncService
       └── FacultyDelegationService
            └── FacultyDashboard
```

### Required Classes from Other Teammates

**From Teammate 1 (Model & Database):**
- `Faculty` model class
- `Student` model class
- `AttendanceSession` model class
- `DatabaseConnection` singleton
- All Repository classes

**From Teammate 2 (Attendance Service):**
- `AttendanceService` class with methods:
  - `getTodaysSessionsForFaculty(String facultyId)`
  - `getActiveSession(String facultyId)`
  - `recordAttendance(String sessionId, String studentId, String type)`
  - `getSessionAttendanceRecords(String sessionId)`

**From Teammate 3 (Authentication Service):**
- `AuthenticationService` class with methods:
  - `authenticateStudent(String studentId, String biometricData)`
  - `validateAuthentication(String studentId)`

**From Teammate 1 or Shared (Sync Service):**
- `SyncService` class with methods:
  - `getSyncStatus()` - returns Map<String, Integer>
  - `synchronizeData()` - returns boolean

---

## Compilation Instructions

### Step 1: Merge Code into Single Repository

All teammates' code must be in the same Maven project:

```
SmartAttendance/
├── pom.xml
└── src/main/java/com/smartattendance/
    ├── model/
    ├── database/
    ├── authentication/
    ├── attendance/
    ├── sync/
    ├── dashboard/
    ├── exceptions/
    └── Main.java
```

### Step 2: Maven Build

```bash
# Clean build
mvn clean compile

# Build with tests
mvn clean test

# Package as JAR
mvn clean package

# Run directly
mvn exec:java -Dexec.mainClass="com.smartattendance.Main"
```

### Step 3: Execute JAR

```bash
java -jar target/smart-attendance-1.0.jar
```

---

## pom.xml Dependencies

Required Maven dependencies in `pom.xml`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>com.smartattendance</groupId>
    <artifactId>smart-attendance-system</artifactId>
    <version>1.0</version>
    <packaging>jar</packaging>

    <name>Smart University Attendance Management System</name>
    <description>Biometric-based attendance tracking system for universities</description>

    <properties>
        <maven.compiler.source>11</maven.compiler.source>
        <maven.compiler.target>11</maven.compiler.target>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    </properties>

    <dependencies>
        <!-- SQLite JDBC -->
        <dependency>
            <groupId>org.xerial</groupId>
            <artifactId>sqlite-jdbc</artifactId>
            <version>3.39.3.0</version>
        </dependency>

        <!-- JUnit for Testing -->
        <dependency>
            <groupId>junit</groupId>
            <artifactId>junit</artifactId>
            <version>4.13.2</version>
            <scope>test</scope>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-compiler-plugin</artifactId>
                <version>3.8.1</version>
                <configuration>
                    <source>11</source>
                    <target>11</target>
                </configuration>
            </plugin>

            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-jar-plugin</artifactId>
                <version>3.2.0</version>
                <configuration>
                    <archive>
                        <manifest>
                            <mainClass>com.smartattendance.Main</mainClass>
                        </manifest>
                    </archive>
                </configuration>
            </plugin>

            <plugin>
                <groupId>org.codehaus.mojo</groupId>
                <artifactId>exec-maven-plugin</artifactId>
                <version>3.0.0</version>
                <configuration>
                    <mainClass>com.smartattendance.Main</mainClass>
                </configuration>
            </plugin>
        </plugins>
    </build>

</project>
```

---

## OOP Concepts Implemented

### 1. **Abstraction**
- `DashboardService` hides complexity of coordinating multiple services
- `LoginService` abstracts authentication mechanism
- `FacultyDelegationService` abstracts delegation logic

### 2. **Encapsulation**
- Private fields in `FacultyDelegation` and `AuditLog`
- Public getters/setters only for necessary data
- Internal state not exposed to caller

### 3. **Inheritance**
- All services extend base functionality
- Models inherit from common base (if implemented)
- Exception hierarchy from `AuthenticationException`, `AttendanceException`

### 4. **Polymorphism**
- `handleMenuSelection()` uses polymorphic method calls
- Service implementations can be swapped (dependency injection pattern)
- `recordAttendance()` handles both automatic and manual types

### 5. **Interfaces**
- Service contracts defined through interface expectations
- Collections use List/Map interfaces (not concrete implementations)

### 6. **Method Overloading**
- `login()` methods with different parameter combinations
- Multiple constructors for services

### 7. **Exception Handling**
- `try-catch` blocks in all service methods
- Custom exceptions (`AuthenticationException`, `AttendanceException`)
- Graceful error recovery in UI

### 8. **Collections**
- `HashMap<String, Faculty>` for faculty data
- `List<AttendanceSession>` for timetable
- `LinkedHashMap<String, Object>` for ordered report data

### 9. **Type Inference**
- Java 11+ var keyword usage where appropriate
- Generic types: `List<String>`, `Map<String, Integer>`

---

## Demonstration Scenario

### Complete Flow from Login to Sync

**Actors:**
- Faculty F001 (Dr. Sharma)
- Students STU001, STU002

**Steps:**

1. **Faculty Logs In**
   ```
   Faculty ID: F001
   Password: faculty123
   ✓ Login successful!
   ```

2. **Dashboard Opens**
   - Faculty sees "Today's Classes" menu

3. **View Classes**
   - Java - Class A - Room 201 - 10:00 AM
   - Python - Class B - Room 202 - 11:00 AM

4. **Start Automatic Attendance**
   - System identifies Java class at 10:00 AM (active session)
   - Waits for student ID card scan

5. **Student Authenticates (STU001)**
   - ID card detected
   - Student authenticated by AuthenticationService
   - Attendance recorded
   - ✓ STU001 present

6. **Student 2 Authenticates (STU002)**
   - Iris scan used instead
   - Student authenticated
   - Attendance recorded
   - ✓ STU002 present

7. **Assign Alternate Faculty**
   - Faculty selects option "Assign Alternate"
   - Enters F002 (Dr. Verma)
   - Delegation recorded in audit log

8. **Offline Mode (Simulate Network Failure)**
   - Third student tries to check in
   - Network is offline
   - Attendance marked as PENDING_SYNC

9. **Restore Network & Sync**
   - Faculty triggers sync from menu
   - SyncService processes pending records
   - All records pushed to database
   - ✓ Sync successful

10. **View Attendance Report**
    - Total classes: 1
    - Total present: 3
    - Attendance rate: 100%

11. **View Audit Log**
    - Attendance recorded events
    - Delegation assigned event
    - Correction request (if any)
    - All with timestamps

12. **Logout**
    - Faculty selects Logout
    - Session closed
    - Database connection closed

---

## Sample Console Output

```
==============================================================================
  SMART ATTENDANCE SYSTEM
  FACULTY DASHBOARD
==============================================================================
  Welcome, Dr. Sharma (F001)
==============================================================================

--------------------------------------------------
MAIN MENU
--------------------------------------------------
1.  View Today's Classes
2.  Start Automatic Attendance
3.  Start Manual Attendance
4.  View Live Attendance
5.  Assign Alternate Faculty
6.  View Attendance Report
7.  View Device Status
8.  View Sync Status
9.  Attendance Correction
10. Logout
--------------------------------------------------
Select option (1-10): 1

--------------------------------------------------
TODAY'S CLASSES
--------------------------------------------------
Subject      | Class    | Room   | Time     | Scheduled Fac    | Actual Fac       | Status    
----------------------------------------------
Java         | Class-A  | 201    | 10:00    | Dr. Sharma       | N/A              | PENDING   
Python       | Class-B  | 202    | 11:00    | Dr. Sharma       | N/A              | PENDING   

Select option (1-10): 2

--------------------------------------------------
START AUTOMATIC ATTENDANCE
--------------------------------------------------
✓ Active session found:
  Subject: Java
  Class: Class-A
  Room: 201
  Scheduled Time: 2024-01-15T10:00:00

Automatic attendance started.
Waiting for student authentication...
(Students will scan ID cards or use iris authentication)

System is in AUTOMATIC mode for this session.

Press ENTER to simulate student authentication (or 'q' to quit): 

[SIMULATION] Student ID card detected...
Enter student ID (e.g., STU001): STU001
Authenticating student: STU001
✓ Attendance recorded for: STU001
  Timestamp: 2024-01-15 10:05:30

Select option (1-10): 4

--------------------------------------------------
VIEW LIVE ATTENDANCE
--------------------------------------------------
Session: Java (Class-A) - Room 201

Student ID   | Timestamp            
--------------------------------------
  STU001     | 2024-01-15 10:05:30

Total present: 1

Select option (1-10): 6

--------------------------------------------------
ATTENDANCE REPORT
--------------------------------------------------
Faculty: Dr. Sharma (F001)
--------------------------------------------------
Faculty ID                : F001
Report Date               : 2024-01-15
Total Classes             : 2
Classes with Attendance   : 1
Total Students Present    : 1
Attendance Rate (%)       : 50.00
Status                    : Attendance records generated successfully

Select option (1-10): 10

--------------------------------------------------
Logging out...
--------------------------------------------------
Goodbye, Dr. Sharma!

Dashboard closed.

[SHUTDOWN] Closing application...
✓ Database connection closed
✓ Application closed successfully
```

---

## Integration Checklist

- [ ] All Teammate 1 model and database classes in place
- [ ] All Teammate 2 attendance service classes in place
- [ ] All Teammate 3 authentication service classes in place
- [ ] All Teammate 4 dashboard classes (7 files) in place
- [ ] `pom.xml` configured with all dependencies
- [ ] Package structure: `com.smartattendance.*`
- [ ] No duplicate classes across teams
- [ ] No SQL executed directly in dashboard
- [ ] All services properly initialized in Main
- [ ] Database connection closed on shutdown
- [ ] Maven compiles without errors
- [ ] Application runs from Main entry point

---

## Troubleshooting

### Issue: "Database connection failed"
- Check `database/smart_attendance.db` exists
- Verify file permissions
- Check `DatabaseConnection` implementation

### Issue: "Service not available"
- Ensure all service classes are created by respective teammates
- Check package names match exactly
- Verify class constructors match expected signatures

### Issue: "Login fails for all credentials"
- Check `LoginService` dummy data is loaded
- Verify password matches "faculty123"
- Check faculty IDs (F001, F002, F003, F004)

### Issue: "Attendance not recorded"
- Verify `AttendanceService.recordAttendance()` exists
- Check session ID is valid
- Ensure student ID format is correct

### Issue: "Maven build fails"
- Clean: `mvn clean`
- Verify Java version: `java -version` (11+)
- Check all dependencies in `pom.xml`

---

## Notes for Presentation

1. **Start with login** using credentials from `LoginService`
2. **Show daily timetable** to demonstrate data integration
3. **Simulate student attendance** to show automatic mode
4. **Demonstrate delegation** to show security features
5. **Show audit logs** to prove accountability
6. **Sync demonstration** for offline capability

---

## Future Enhancements

- GUI using JavaFX or Swing
- Real biometric device integration
- Database persistence for audit logs
- Email notifications for delegations
- Advanced analytics and reporting
- Integration with student information system


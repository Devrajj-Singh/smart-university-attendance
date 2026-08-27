# Teammate 4: Faculty Dashboard & Application Integration

## Responsibility Overview

As Teammate 4, you are responsible for:

1. **Faculty Dashboard (`dashboard/` package)**
   - Console-based UI for faculty operations
   - Menu-driven interface
   - User input handling and validation

2. **Application Integration**
   - Connect all four teammates' modules
   - Orchestrate services coordination
   - Manage application lifecycle

3. **Login & Authentication UI**
   - Faculty login interface
   - Credential validation
   - Session management

---

## Files You Create

### 1. FacultyDashboard.java
**Location**: `src/main/java/com/smartattendance/dashboard/`

**Responsibility**: Main console UI for faculty

**Key Methods**:
- `start()` - Start dashboard loop
- `displayMainMenu()` - Show menu options
- `viewTodaysClasses()` - Display timetable
- `startAutomaticAttendance()` - Launch automatic mode
- `startManualAttendance()` - Launch manual mode
- `viewLiveAttendance()` - Show attendance in progress
- `assignAlternateFaculty()` - Delegate class
- `viewAttendanceReport()` - Generate reports
- `viewDeviceStatus()` - Check device health
- `viewSyncStatus()` - Monitor sync queue
- `requestAttendanceCorrection()` - Request correction

**Key OOP Features**:
- Encapsulation of UI state
- Exception handling
- Scanner resource management
- Menu navigation logic

---

### 2. LoginService.java
**Location**: `src/main/java/com/smartattendance/dashboard/`

**Responsibility**: Faculty authentication with dummy credentials

**Key Methods**:
- `login(String facultyId, String password)` - Authenticate faculty
- `displayLoginInstructions()` - Show demo credentials
- `isValidFacultyIdFormat(String)` - Validate format

**Dummy Credentials**:
```
F001 - Dr. Sharma - faculty123
F002 - Dr. Verma - faculty123
F003 - Prof. Patel - faculty123
F004 - Prof. Singh - faculty123
```

**Key OOP Features**:
- Static initialization block
- Exception throwing
- Credential validation
- Immutable static data

---

### 3. FacultyDelegationService.java
**Location**: `src/main/java/com/smartattendance/dashboard/`

**Responsibility**: Manage faculty delegation and alternate assignments

**Key Methods**:
- `assignAlternateFaculty()` - Create delegation record
- `getActiveDelegation()` - Retrieve current delegation
- `isAuthorizedFaculty()` - Check authorization
- `revokeDelegation()` - Cancel delegation
- `getDelegationAuditLog()` - View all delegations

**Key OOP Features**:
- HashMap for delegation storage
- Delegation object creation
- Authorization checking
- Audit trail maintenance

---

### 4. DashboardService.java
**Location**: `src/main/java/com/smartattendance/dashboard/`

**Responsibility**: Orchestrate all dashboard operations

**Key Methods**:
- `getTodaysClasses()` - Get faculty's timetable
- `getActiveSession()` - Find current class
- `recordAutomaticAttendance()` - Auto attendance
- `recordManualAttendance()` - Manual attendance
- `generateAttendanceReport()` - Create report
- `getSyncStatus()` - Check sync queue
- `triggerSync()` - Start synchronization
- `requestAttendanceCorrection()` - Request correction

**Dependencies**:
- AttendanceService (Teammate 2)
- AuthenticationService (Teammate 3)
- SyncService (Teammate 1)
- FacultyDelegationService (this module)

**Key OOP Features**:
- Service coordination
- Dependency injection
- Exception handling
- Audit logging

---

### 5. Main.java
**Location**: `src/main/java/com/smartattendance/`

**Responsibility**: Application entry point and orchestration

**Key Methods**:
- `main()` - Application start
- `initializeDatabase()` - Connect to DB
- `initializeServices()` - Create all services
- `loadDummyData()` - Load sample data
- `showLoginInterface()` - Handle login flow
- `shutdown()` - Clean up resources

**Execution Flow**:
```
main()
  ├── initializeDatabase()
  ├── initializeServices()
  ├── loadDummyData()
  ├── showLoginInterface()
  │   ├── Display login instructions
  │   ├── Get faculty credentials
  │   ├── Validate with LoginService
  │   └── Open FacultyDashboard
  └── shutdown()
```

**Key OOP Features**:
- Singleton pattern (DatabaseConnection)
- Exception handling
- Resource cleanup
- Layered architecture

---

### 6. FacultyDelegation.java (Model)
**Location**: `src/main/java/com/smartattendance/model/`

**Responsibility**: Represent delegation records

**Fields**:
- `delegationId` - Unique identifier
- `sessionId` - Which class session
- `originalFaculty` - Scheduled faculty
- `alternateFaculty` - Delegate faculty
- `authorizedBy` - Who authorized
- `timestamp` - When delegated
- `status` - ACTIVE/REVOKED/EXPIRED

**Key Methods**:
- Getters/setters for all fields
- `isActive()` - Check if currently active

---

### 7. AuditLog.java (Model)
**Location**: `src/main/java/com/smartattendance/model/`

**Responsibility**: Represent audit trail entries

**Fields**:
- `logId` - Unique entry ID
- `action` - What happened
- `details` - Additional info
- `performedBy` - Who did it
- `timestamp` - When it happened

**Key Methods**:
- Getters for all fields
- `getFormattedEntry()` - Pretty print

---

## Dependency Map

```
Main.java
  ↓
FacultyDashboard
  ↓
DashboardService
  ├── AttendanceService (Teammate 2)
  ├── AuthenticationService (Teammate 3)
  ├── SyncService (Teammate 1)
  ├── FacultyDelegationService
  └── LoginService
```

### Required from Teammates

**From Teammate 1** (Model & Database):
```java
// Models
Faculty
Student
AttendanceSession
// Connection
DatabaseConnection
// Repositories
FacultyRepository
StudentRepository
AttendanceRepository
SessionRepository
```

**From Teammate 2** (Attendance Service):
```java
AttendanceService
  - getTodaysSessionsForFaculty(String)
  - getActiveSession(String)
  - recordAttendance(String, String, String)
  - getSessionAttendanceRecords(String)
```

**From Teammate 3** (Authentication Service):
```java
AuthenticationService
  - authenticateStudent(String, String)
  - validateAuthentication(String)
```

**From Teammate 1** (Sync Service):
```java
SyncService
  - getSyncStatus() → Map<String, Integer>
  - synchronizeData() → boolean
```

---

## Integration Strategy

### DO NOT:
- ❌ Recreate Student, Faculty, AttendanceSession classes
- ❌ Implement your own AttendanceService
- ❌ Execute SQL queries directly
- ❌ Use different package names
- ❌ Create duplicate services

### DO:
- ✅ Use repository pattern for data access
- ✅ Use dependency injection for services
- ✅ Handle exceptions gracefully
- ✅ Create audit trail for important actions
- ✅ Maintain clean separation of concerns
- ✅ Follow OOP principles
- ✅ Test all integrations

---

## Testing Strategy

### Unit Tests for Your Components
```java
public class FacultyDelegationServiceTest {
    @Test
    public void testAssignAlternateFaculty() { }
    
    @Test
    public void testPreventSelfDelegation() { }
    
    @Test
    public void testRevokeDelegation() { }
}

public class LoginServiceTest {
    @Test
    public void testValidLogin() { }
    
    @Test
    public void testInvalidPassword() { }
    
    @Test
    public void testInvalidFacultyId() { }
}
```

### Integration Tests
```java
public class DashboardServiceIntegrationTest {
    @Test
    public void testEndToEndAttendanceFlow() { }
    
    @Test
    public void testSyncWithOtherServices() { }
}
```

---

## OOP Concepts Used

### 1. Abstraction
- DashboardService abstracts complexity
- Hides database details from UI
- Hides biometric authentication logic

### 2. Encapsulation
- Private fields in all classes
- Controlled access via getters/setters
- Hidden internal state

### 3. Inheritance
- Exception hierarchy
- Service base classes (if implemented)
- Model inheritance patterns

### 4. Polymorphism
- Method overloading in constructors
- Service interface contracts
- Polymorphic attendance types (AUTO/MANUAL)

### 5. Interfaces
- Service interfaces
- Collection interfaces (List, Map)
- Contract definitions

### 6. Exception Handling
- try-catch-finally blocks
- Custom exceptions
- Graceful error recovery

### 7. Collections
- HashMap for delegations
- ArrayList for audit logs
- LinkedHashMap for ordered data

---

## Expected Test Scenarios

### Scenario 1: Complete Attendance Flow
```
1. Faculty logs in (F001)
2. Views classes for today
3. Starts automatic attendance
4. Student authenticates (STU001)
5. Attendance recorded
6. System shows live attendance
7. Faculty views report
8. Logout
```

### Scenario 2: Faculty Delegation
```
1. Faculty starts class (F001)
2. Another faculty arrives late (F002)
3. Original faculty delegates to F002
4. Delegation logged in audit trail
5. F002 can now record attendance
6. Delegation can be revoked
```

### Scenario 3: Offline Synchronization
```
1. Faculty takes attendance
2. Network goes offline
3. New attendance marked PENDING_SYNC
4. Faculty triggers sync manually
5. Records synchronized when online
6. Audit log updated
```

### Scenario 4: Attendance Correction
```
1. Faculty requests correction
2. Student was marked ABSENT
3. Request to change to PRESENT
4. Reason: "Biometric malfunction"
5. Audit log created
6. Correction marked PENDING_APPROVAL
```

---

## Console Output Examples

### Login Screen
```
==============================================================================
  SMART ATTENDANCE SYSTEM
==============================================================================

Demo Credentials:
--------------------------------------------------
Faculty ID: F001
Name: Dr. Sharma
Department: Computer Science
Password: faculty123

Faculty ID: F002
Name: Dr. Verma
Department: Information Technology
Password: faculty123
...
--------------------------------------------------
Faculty ID: 
```

### Dashboard Menu
```
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
Select option (1-10): 
```

### Attendance Recording
```
✓ Attendance recorded for: STU001
  Timestamp: 2024-01-15 10:05:30
```

---

## Maven Build

```bash
# Build your package
mvn clean compile

# Run tests
mvn test

# Package
mvn package

# Run application
java -jar target/smart-attendance-system-1.0.jar

# Run via Maven
mvn exec:java -Dexec.mainClass="com.smartattendance.Main"
```

---

## Code Quality Checklist

- [ ] All methods have Javadoc comments
- [ ] Exception handling in all service methods
- [ ] No hardcoded SQL queries
- [ ] No System.exit() except in Main
- [ ] Resource cleanup (Scanner, Connection)
- [ ] Proper null checking
- [ ] Meaningful variable names
- [ ] DRY principle followed
- [ ] SOLID principles applied
- [ ] No duplicate code

---

## Presentation Points

1. **Demonstrate Login**
   - Show multiple dummy credentials
   - Explain security implications

2. **Show Dashboard Menu**
   - Walk through each option
   - Explain OOP design

3. **Simulate Attendance**
   - Show automatic mode
   - Show manual mode
   - Show live attendance

4. **Demonstrate Delegation**
   - Assign alternate faculty
   - Show audit trail
   - Explain authorization checks

5. **Show Sync Mechanism**
   - Demonstrate pending records
   - Trigger synchronization
   - Show audit log

6. **Explain Integration**
   - Show how services coordinate
   - Explain dependency injection
   - Demonstrate error handling

---

## Support

If teammates' services are incomplete:

1. **Ask teammates to provide**:
   - Interface definitions
   - Method signatures
   - Expected return types

2. **Document required methods**:
   - Clear method contracts
   - Parameter types
   - Return types
   - Exceptions thrown

3. **Create mock implementations** temporarily:
   - Allows testing your code
   - Can be replaced later
   - Maintains integration

---

## Next Steps

1. Get required classes from teammates
2. Compile with their code
3. Run Main.java
4. Verify login works
5. Test each menu option
6. Demonstrate complete flow
7. Collect feedback

---

## Questions to Ask Teammates

**For Teammate 1 (Model & DB)**:
- What does `Faculty` class look like?
- How to query today's sessions?
- Is `DatabaseConnection` a singleton?

**For Teammate 2 (Attendance)**:
- How to record attendance?
- What format for student ID?
- How to get session attendance records?

**For Teammate 3 (Authentication)**:
- How does student authentication work?
- What exceptions are thrown?
- How to check if student is authenticated?

**For Teammate 1/Shared (Sync)**:
- How does sync status work?
- What does pending record look like?
- How long does sync take?


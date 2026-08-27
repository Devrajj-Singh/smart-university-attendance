# Smart University Attendance Management System

## Teammate 1 module: `model/` + `database/`

This README documents only the part of the project owned by Teammate 1
(model classes + database layer). It's written so Teammates 2 (attendance
engine), 3 (authentication) and 4 (sync/dashboard) can start using this
module immediately without reading the source.

---

## 1. Folder structure (as delivered)

```
SmartAttendance/
├── README.md
├── pom.xml
├── database/
│   └── smart_attendance.db          (created automatically on first run)
└── src/
    └── main/
        └── java/
            └── com/
                └── smartattendance/
                    ├── model/
                    │   ├── User.java                 (abstract)
                    │   ├── Student.java
                    │   ├── Faculty.java
                    │   ├── Admin.java
                    │   ├── Subject.java
                    │   ├── ClassSection.java
                    │   ├── Classroom.java
                    │   ├── Timetable.java
                    │   ├── AttendanceSession.java
                    │   ├── AttendanceRecord.java
                    │   ├── FacultyDelegation.java
                    │   ├── BiometricDevice.java
                    │   └── AuditLog.java
                    │
                    └── database/
                        ├── DatabaseManager.java
                        ├── SchemaDefinition.java        (package-private, used by DatabaseManager)
                        ├── DatabaseSeeder.java           (inserts the dummy data)
                        └── repository/
                            ├── StudentRepository.java
                            ├── FacultyRepository.java
                            ├── SubjectRepository.java
                            ├── TimetableRepository.java
                            ├── AttendanceRepository.java
                            ├── DelegationRepository.java
                            ├── AdminRepository.java              (extra, see note below)
                            ├── ClassSectionRepository.java       (extra, see note below)
                            ├── ClassroomRepository.java          (extra, see note below)
                            ├── BiometricDeviceRepository.java    (extra, see note below)
                            └── AuditLogRepository.java           (extra, see note below)
```

> **Note on the "extra" repositories:** the brief listed 6 repositories.
> While building those 6, four tables (`class_sections`, `classrooms`,
> `admins`, `biometric_devices`, `audit_logs`) had no repository at all,
> which would have blocked `AttendanceRepository`/`TimetableRepository`
> from working (they need to look up classrooms/class sections) and left
> other teammates with no way to read those tables. I added five small,
> single-purpose repositories to cover them. They follow the exact same
> pattern as the required six, so there's nothing new to learn.

I did **not** touch `authentication/`, `attendance/`, `sync/`, `dashboard/`
or `Main.java` — those stay yours.

---

## 2. Database setup (SQLite)

- DB file: `database/smart_attendance.db` (relative to the project root,
  created automatically the first time `DatabaseManager` runs).
- Driver: `org.xerial:sqlite-jdbc` (already added to `pom.xml`).
- No manual `.sql` file to run — the schema is created in code
  (`SchemaDefinition.java`) via `DatabaseManager.initializeSchema()`,
  using `CREATE TABLE IF NOT EXISTS`, so it's safe to call on every
  startup.

### Tables created

| Table | Backing model |
|---|---|
| `students` | `Student` |
| `faculty` + `faculty_subjects` | `Faculty` |
| `admins` | `Admin` |
| `subjects` | `Subject` |
| `class_sections` | `ClassSection` |
| `classrooms` | `Classroom` |
| `timetable` | `Timetable` |
| `attendance_sessions` | `AttendanceSession` |
| `attendance_records` | `AttendanceRecord` |
| `faculty_delegations` | `FacultyDelegation` |
| `biometric_devices` | `BiometricDevice` |
| `audit_logs` | `AuditLog` |

Foreign keys are enforced (`PRAGMA foreign_keys = ON`), e.g.
`students.class_id → class_sections.class_id`,
`timetable.faculty_id → faculty.user_id`, etc.

### How to initialize + seed

```java
DatabaseManager db = DatabaseManager.getInstance();
db.initializeSchema();     // creates tables if they don't exist
DatabaseSeeder.seed();     // inserts dummy data, skips if already seeded
```

Whoever ends up writing `Main.java` should call these two lines once at
startup, before anything else touches the database.

---

## 3. Dummy data (inserted by `DatabaseSeeder`)

- **15 students** (`STU001`–`STU015`), split across two classes
- **3 faculty** (`FAC001`–`FAC003`), Computer Science department
- **2 subjects**: Data Structures (`SUB001`/CS201), Database Systems (`SUB002`/CS202)
- **2 class sections**: CSE-A (`CLS001`), CSE-B (`CLS002`)
- **3 classrooms**: Room 101, Room 102 (Main Block), Room 201 (Annex Block)
- **5 timetable entries** spread across Mon–Thu

All fake but realistic (Indian student/faculty names, standard CS course
codes) — easy to eyeball while debugging.

---

## 4. The models, one by one

- **`User`** *(abstract)* — common fields `userId`, `name`, `email`;
  declares abstract `getRole()` and `displayDashboard()`.
- **`Student extends User`** — adds `cardId`, `biometricId`, `classId`
  for the two authentication modes (card tap / simulated iris).
- **`Faculty extends User`** — adds `employeeCode`, `department`, and an
  internal (read-only from outside) list of subject IDs they teach.
- **`Admin extends User`** — adds `accessLevel`.
- **`Subject`** — a course (`subjectId`, `subjectName`, `subjectCode`, `creditHours`).
- **`ClassSection`** — a student batch/section (named `ClassSection`, not
  `Class`, to avoid clashing with `java.lang.Class`).
- **`Classroom`** — a physical room, capacity, building.
- **`Timetable`** — one recurring weekly slot: subject + class + faculty
  + classroom + day/time. The "Automatic Mode" engine (Teammate 2) reads
  this to know what should currently be running.
- **`AttendanceSession`** — one real, dated occurrence of a class. Holds
  full `Subject`/`ClassSection`/`Classroom`/`Faculty` objects (not just
  IDs) so downstream code doesn't need extra lookups. Distinguishes
  `scheduledFaculty` (from the timetable) vs `actualFaculty` (who really
  taught it, in case of a substitution) and has a convenience
  `isSubstituted()` method.
- **`AttendanceRecord`** — one student's attendance entry for one
  session: method used (`CARD`/`BIOMETRIC`/`MANUAL`), status
  (`PRESENT`/`ABSENT`/`LATE`), and a `synced` flag for the offline/sync flow.
- **`FacultyDelegation`** — records a substitution: original faculty,
  substitute, date, reason, approval flag.
- **`BiometricDevice`** — a (simulated) reader installed in a classroom;
  tracks online/offline status and last sync time.
- **`AuditLog`** — generic "who did what, to what, when" trail entry.

---

## 5. OOP concepts used (for your report/demo)

- **Abstraction** — `User` is `abstract`, with abstract `getRole()` and
  `displayDashboard()`; you can never instantiate a bare `User`.
- **Inheritance** — `Student`, `Faculty`, `Admin` all `extends User`.
- **Polymorphism** — calling `displayDashboard()` on a `User` reference
  gives different output depending on the real runtime type. Example:

  ```java
  List<User> users = List.of(student, faculty, admin);
  for (User u : users) {
      System.out.println(u.displayDashboard()); // different per subclass
  }
  ```

- **Encapsulation** — all fields are `private`/`protected`; access is
  only through getters (and setters where mutation genuinely makes
  sense, e.g. updating a card ID). `Faculty.getSubjectIds()` returns an
  *unmodifiable* view so outside code can't corrupt the internal list —
  it has to go through `assignSubject(...)`.
- **Enums for controlled vocabularies** — `AttendanceSession.SessionStatus`,
  `AttendanceRecord.AuthMethod`/`AttendanceStatus`,
  `BiometricDevice.DeviceStatus` — avoids "magic strings" scattered
  around the codebase.
- **Repository pattern** — all SQL is isolated inside `database/repository/`;
  nothing outside that package should ever write raw SQL against these
  tables.

---

## 6. Public API / constructors other teammates should use

```java
// Student
Student(String userId, String name, String email,
        String cardId, String biometricId, String classId)
// getUserId() getName() getEmail() getCardId() getBiometricId() getClassId()

// Faculty
Faculty(String userId, String name, String email,
        String employeeCode, String department)
// getUserId() getName() getEmail() getEmployeeCode() getDepartment()
// getSubjectIds() (read-only) / assignSubject(String subjectId)

// Admin
Admin(String userId, String name, String email, String accessLevel)

// Subject
Subject(String subjectId, String subjectName, String subjectCode, int creditHours)

// ClassSection
ClassSection(String classId, String className, String department, int year)

// Classroom
Classroom(String classroomId, String roomNumber, String building, int capacity)

// Timetable
Timetable(String timetableId, String subjectId, String classId,
          String facultyId, String classroomId,
          DayOfWeek dayOfWeek, LocalTime startTime, LocalTime endTime)

// AttendanceSession
AttendanceSession(String sessionId, Subject subject, ClassSection classSection,
                   Classroom classroom, Faculty scheduledFaculty, Faculty actualFaculty,
                   LocalDateTime startTime, LocalDateTime endTime, SessionStatus status)
// getSessionId() getSubject() getClassSection() getClassroom()
// getScheduledFaculty() getActualFaculty() getStartTime() getEndTime()
// getStatus() isSubstituted()
// setActualFaculty(Faculty) / setStatus(SessionStatus)  <- for substitution/status updates

// AttendanceRecord
AttendanceRecord(String recordId, String sessionId, String studentId,
                  LocalDateTime timestamp, AuthMethod method,
                  AttendanceStatus status, boolean synced)
// getRecordId() getSessionId() getStudentId() getTimestamp()
// getMethod() getStatus() isSynced()
// setStatus(AttendanceStatus) / markSynced()

// FacultyDelegation
FacultyDelegation(String delegationId, String timetableId, String originalFacultyId,
                   String substituteFacultyId, LocalDate date, String reason, boolean approved)
// ... getters + approve()

// BiometricDevice
BiometricDevice(String deviceId, String classroomId, String deviceType,
                 DeviceStatus status, LocalDateTime lastSyncTime)

// AuditLog
AuditLog(String logId, String actorId, String action, String entityType,
         String entityId, LocalDateTime timestamp, String details)
```

### Repositories (all in `com.smartattendance.database.repository`)

Every repository is a plain class with a no-arg constructor (it pulls
the shared `Connection` from `DatabaseManager.getInstance()` itself —
you never construct or pass a `Connection` yourself):

| Repository | Key methods |
|---|---|
| `StudentRepository` | `insert`, `findById`, `findByCardId`, `findByBiometricId`, `findByClassId`, `findAll`, `update`, `delete` |
| `FacultyRepository` | `insert`, `findById`, `findAll`, `update`, `delete`, `assignSubject`, `findSubjectIdsForFaculty` |
| `SubjectRepository` | `insert`, `findById`, `findAll`, `update`, `delete` |
| `TimetableRepository` | `insert`, `findById`, `findByFacultyId`, `findByClassId`, `findByDay`, `findAll`, `delete` |
| `AttendanceRepository` | `insertSession`, `findSessionById`, `findSessionsByClassId`, `findAllSessions`, `updateSessionStatus`, `insertRecord`, `findRecordsBySession`, `findRecordsByStudent`, `findUnsyncedRecords`, `markRecordSynced` |
| `DelegationRepository` | `insert`, `findById`, `findByOriginalFaculty`, `findBySubstituteFaculty`, `findAll`, `approve` |
| `AdminRepository`, `ClassSectionRepository`, `ClassroomRepository`, `BiometricDeviceRepository`, `AuditLogRepository` | same pattern: `insert` / `findById` / `findAll` |

---

## 7. Integration guide

### Teammate 2 — attendance engine (`attendance/`)
- Use `TimetableRepository.findByDay(...)` / `findByFacultyId(...)` to
  figure out what should be running right now (Automatic Mode).
- Create an `AttendanceSession` when a class starts, save it with
  `AttendanceRepository.insertSession(...)`.
- As students authenticate (card/biometric), look them up with
  `StudentRepository.findByCardId(...)` or `findByBiometricId(...)`,
  then build an `AttendanceRecord` and save it with
  `AttendanceRepository.insertRecord(...)`.
- For offline capture, just build records with `synced = false`; the
  sync module (Teammate 4) will pick them up.

### Teammate 3 — authentication (`authentication/`)
- You own the actual login/auth *interfaces* — I deliberately didn't
  create any, per the brief.
- For faculty/admin login, look users up via `FacultyRepository.findById(...)`
  / `AdminRepository.findById(...)` and check against whatever
  credential store you build.
- For student check-in (card/biometric), `StudentRepository.findByCardId(...)`
  and `findByBiometricId(...)` are already there for you.

### Teammate 4 — sync + dashboard (`sync/`, `dashboard/`)
- **Sync**: `AttendanceRepository.findUnsyncedRecords()` gives you
  everything that still needs to go to the server; call
  `markRecordSynced(recordId)` once it's confirmed.
- **Dashboard**: `AttendanceRepository.findSessionsByClassId(...)` /
  `findRecordsByStudent(...)` for reports; `User.displayDashboard()` is
  already polymorphic, so a dashboard screen can just call it on
  whatever `User` is logged in without an `instanceof` chain.
- **Audit logs**: write with `AuditLogRepository.insert(...)`, read with
  `findAll()` / `findByActor(...)`.

### Everyone
- Always start with:
  ```java
  DatabaseManager.getInstance().initializeSchema();
  DatabaseSeeder.seed();
  ```
- Never write raw SQL outside `database/repository/` — add a method to
  the relevant repository instead, so the SQL stays in one place.

---

## 8. Example usage

```java
import com.smartattendance.database.DatabaseManager;
import com.smartattendance.database.DatabaseSeeder;
import com.smartattendance.database.repository.AttendanceRepository;
import com.smartattendance.database.repository.StudentRepository;
import com.smartattendance.database.repository.TimetableRepository;
import com.smartattendance.model.Student;
import com.smartattendance.model.Timetable;
import com.smartattendance.model.AttendanceRecord;

import java.util.List;

public class IntegrationExample {
    public static void main(String[] args) {
        // 1. Start up the DB (idempotent - safe to call every run)
        DatabaseManager.getInstance().initializeSchema();
        DatabaseSeeder.seed();

        // 2. Retrieve a Student
        StudentRepository studentRepository = new StudentRepository();
        Student student = studentRepository.findById("STU001");
        System.out.println(student.displayDashboard());

        // 3. Retrieve a Timetable entry (everything for a given class)
        TimetableRepository timetableRepository = new TimetableRepository();
        List<Timetable> classSchedule = timetableRepository.findByClassId("CLS001");
        classSchedule.forEach(System.out::println);

        // 4. Retrieve AttendanceRecords for a student
        AttendanceRepository attendanceRepository = new AttendanceRepository();
        List<AttendanceRecord> records = attendanceRepository.findRecordsByStudent("STU001");
        System.out.println(student.getName() + " has " + records.size() + " attendance record(s).");
    }
}
```

---

## 9. Build

```bash
mvn clean compile
```

The `sqlite-jdbc` dependency is already declared in `pom.xml`, so no
extra setup is needed beyond a normal `mvn` build.

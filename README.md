# Smart University Attendance Management System

Java Maven academic prototype for a university attendance system that combines timetable-based sessions, manual faculty attendance, contactless ID-card UID authentication, simulated iris authentication, faculty delegation, offline sync, reporting, and a small SQLite database.

This project does not implement real card-reader or biometric hardware. Card UID and iris checks are simulated in Java for demonstration and testing.

## Problem Statement

Universities need attendance capture that is tied to official student identity, class timetable, faculty authorization, and later reporting. This prototype models a realistic flow where classroom devices can capture attendance locally using a student registration number, card UID, or simulated iris ID, then synchronize records to a backend simulation.

## Solution Overview

- Student registration number is the canonical student identity.
- Dummy students are `25215101` through `25215165`.
- Each student has a unique contactless card UID and simulated iris biometric ID.
- Faculty can start automatic sessions from timetable slots or create manual sessions.
- Attendance is validated for enrollment, open attendance window, duplicate prevention, and faculty authorization.
- Delegated faculty can take over a scheduled session with audit-friendly delegation state.
- Offline attendance records are queued and synchronized through a simulated backend.

## Package Structure

- `com.smartattendance.model`: domain models and enums.
- `com.smartattendance.database`: SQLite connection, schema, and seeding.
- `com.smartattendance.database.repository`: repository layer for all database access.
- `com.smartattendance.attendance`: attendance service, timetable resolution, validation, and reports.
- `com.smartattendance.authentication`: ID-card UID and simulated iris authentication.
- `com.smartattendance.sync`: offline sync queue and backend simulation.
- `com.smartattendance.dashboard`: console dashboard and faculty delegation support.
- `com.smartattendance.exceptions`: custom checked business exceptions.

## OOP Concepts

- Encapsulation: private/protected fields with controlled getters/setters.
- Abstraction: `User` is an abstract base class; service contracts hide repository details.
- Inheritance: `Student`, `Faculty`, and `Admin` extend `User`.
- Polymorphism: `displayDashboard()` behaves differently for each `User` subtype; authentication methods implement a shared interface.

## Identity and Authentication

`Student.userId` is the university registration number. `getId()`, `getStudentId()`, and `getRegistrationNumber()` all return the same canonical value.

ID-card authentication checks a simulated contactless UID (`cardId`/`cardUid`) against the registered student. Iris authentication checks a simulated biometric template ID. No real hardware SDKs or device integrations are used.

## Attendance Modes

Automatic attendance uses `TimetableService` to resolve the current timetable slot by faculty, classroom, day, and time, then starts an active attendance session.

Manual attendance lets a faculty member create or choose a session directly and mark students manually.

Both modes use the same validation rules: valid student, enrolled class, active/open session window, no duplicate record, and authorized faculty for session management.

## Offline Sync

Attendance records are stored locally with `synced=false`. `SyncService` creates `SyncRecord` queue entries, submits them to `UniversityAttendanceBackend`, marks successful records as synced, and avoids re-syncing completed entries.

## Faculty Delegation

`FacultyDelegation` records original faculty, alternate faculty, session/timetable reference, approver, status, timestamps, and revocation time. The dashboard delegation service uses that same model, and attendance sessions record scheduled versus actual faculty.

## SQLite Dummy Database

The database file is `database/smart_attendance.db`. Startup creates tables if needed and seeds demo data. The seeder guarantees 65 dummy students with registration numbers `25215101` through `25215165`, unique card UIDs, and unique simulated iris IDs.

## Build, Test, Run

```bash
mvn clean compile
mvn test
mvn exec:java "-Dexec.mainClass=com.smartattendance.Main"
```

The main application runs a compact console demo: database initialization, dummy data use, card UID authentication, attendance recording, duplicate prevention, faculty delegation, offline sync, and a session summary.

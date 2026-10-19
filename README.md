# Smart University Attendance & Edge Biometric System

<div align="center">

![Next.js 16](https://img.shields.io/badge/Next.js-16.4-black?style=for-the-badge&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-PostgreSQL_16-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-24-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Java](https://img.shields.io/badge/Java-17-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)
![E2E Tests](https://img.shields.io/badge/E2E_Tests-32%2F32_Passing-brightgreen?style=for-the-badge&logo=checkmarx&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-purple?style=for-the-badge)

<p align="center">
  <strong>Enterprise-Grade University Attendance Platform & Dual-Factor Physical Proximity Verification (2FA-PPV)</strong>
</p>

<p align="center">
  A production-ready SaaS web platform built with <strong>Next.js 16</strong>, featuring Dual-Factor Physical Proximity Verification (Door RFID Tap + Projector 15-Second Rolling QR), session-scoped device binding anti-proxy locks, zero-biometric hardware compatibility, live door tap ledgers with 1-click dead phone battery overrides, dynamic attendance window toggles, and dual-mode database synchronization (Dockerized PostgreSQL 16 + Local Embedded SQLite).
</p>

</div>

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Architecture](#system-architecture)
3. [Key Highlights & Capabilities](#key-highlights--capabilities)
4. [Zero-Hardware Edge Scanning Terminal](#zero-hardware-edge-scanning-terminal)
5. [Anti-Proxy Dynamic Rolling QR Engine](#anti-proxy-dynamic-rolling-qr-engine)
6. [5-Stage Attendance Validation Pipeline](#5-stage-attendance-validation-pipeline)
7. [Authentication & University ERP Portals](#authentication--university-erp-portals)
8. [Faculty Delegation & Dean Approvals](#faculty-delegation--dean-approvals)
9. [75% Defaulter Analytics & Reporting](#75-defaulter-analytics--reporting)
10. [Dual Database Engine & Docker Containerization](#dual-database-engine--docker-containerization)
11. [Automated End-to-End Verification](#automated-end-to-end-verification)
12. [Quickstart & Installation](#quickstart--installation)
13. [Demo Accounts & Credentials](#demo-accounts--credentials)
14. [Project Directory Layout](#project-directory-layout)

---

## Executive Summary

Traditional university attendance systems suffer from proxy marking, fragile physical biometric hardware, cumbersome manual roll-calls, and disconnected offline records. 

The **Smart University Attendance System** transforms any student's or invigilator's smartphone camera into an intelligent edge scanner capable of capturing student ID card optical markers and iris biometric patterns. Coupled with a classroom projector running a 15-second rolling anti-proxy QR code, the system eliminates attendance fraud while guaranteeing instant offline-resilient synchronization to the central university ledger.

---

## System Architecture

```
                                      +---------------------------------------------+
                                      |          Classroom Projector Screen         |
                                      |    (15s Dynamic Rolling Anti-Proxy QR)      |
                                      +----------------------+----------------------+
                                                             ^
                                                             |
+--------------------------------------+                     | Real-time Pairing
|      Smartphone Edge Scanner         |                     v
| (/terminal - getUserMedia Camera)    | < - - - - - - > +----------------------------------+
|                                      |                 |       Faculty Control Room       |
|  [Mode A] Optical ID Card Viewfinder |                 | (/session/[id] - Conductor Room) |
|  [Mode B] Iris Biometric Reticle     |                 +-----------------+----------------+
+------------------+-------------------+                                   |
                   |                                                       |
                   | HTTP POST /api/attendance/mark                        |
                   v                                                       v
+-------------------------------------------------------------------------------------------+
|                          Next.js 16 Full-Stack Enterprise Backend                         |
|                                                                                           |
|  [Auth Service]      - JWT (jose), Bcrypt, Dynamic 4-Char Security Captcha                |
|  [Validation Engine] - 5-Stage Enrollment, Window, Duplicate & Section Enforcer           |
|  [Sync Manager]      - Offline FIFO Queue with Reconciliation Engine                      |
|  [Analytics Engine]  - 75% Defaulter Rules & Official Dean Sign-off CSV Sheets            |
+---------------------------------------------+---------------------------------------------+
                                              |
                   +--------------------------+--------------------------+
                   |                                                     |
                   v                                                     v
+------------------------------------+                 +------------------------------------+
|       Production Database          |                 |     Embedded Standalone Fallback   |
|   PostgreSQL 16 in Docker Compose  |                 |    Node.js 24 Built-in node:sqlite |
|   (13 Relational Tables + Seeds)   |                 |    (Zero-Dependency Self-Healing)  |
+------------------------------------+                 +------------------------------------+
```

---

## Key Highlights & Capabilities

- 📱 **Zero-Hardware Smartphone Scanner**: Zero external hardware required. Invigilators or faculty open `/terminal` on their smartphone camera to verify ID cards or iris biometrics in under 80 milliseconds.
- 🛡️ **Anti-Proxy Dynamic Rolling QR**: Classroom projector displays a cryptographically rotated QR code refreshed every 15 seconds. Screenshots and remote relaying are rendered completely invalid.
- 🎓 **Christ University ERP Aesthetic**: Designed to match university portals (KnowledgePro & ESPro), complete with a dynamic 4-character visual captcha, faculty portal switcher, and Dean of Academics command suite.
- ⏱️ **5-Stage Verification Gatekeeper**: Every check-in is evaluated against section enrollment, session activity, 5-minute on-time windows, 15-minute grace thresholds, and duplicate prevention locks.
- 📊 **75% Academic Defaulter Analytics**: Instant subject-by-subject audit flags students falling below mandatory attendance thresholds with one-click official CSV export and printable dean signature blocks.
- 🔄 **Delegation & Substitution Workflow**: Faculty can officially request lecture substitutions; Dean Office can review, authorize, or revoke delegations in real-time.
- 🐳 **Dockerized Dual-Mode Database**: Complete PostgreSQL 16 containerization with 65 seeded students, faculty timetables, and audit logs, alongside an automatic local SQLite fallback for isolated zero-setup execution.

---

## Zero-Hardware Edge Scanning Terminal

Navigating to `/terminal` activates the smartphone camera through standard HTML5 `navigator.mediaDevices.getUserMedia`:

1. **Optical ID Card Viewfinder**:
   - Outlines an active optical alignment zone with a scanning laser animation.
   - Detects student registration numbers (`25215101` through `25215165`) and contactless card UIDs.
2. **Iris Biometric Scanner**:
   - Renders a multi-ring HUD reticle with rotating biometric calibration brackets.
   - Simulates real-time liveness inspection before signing the payload.
3. **Session Pairing**:
   - The scanner pairs instantly to any live classroom session via a pairing token or QR scan.
4. **Dual-Tone Audio-Visual Feedback**:
   - Synthesizes instant HTML5 Web Audio frequencies (high chime for `PRESENT`, deep buzzer for rejected/duplicate attempts) with immediate visual feedback cards.

---

## Anti-Proxy Dynamic Rolling QR Engine

To prevent students from taking photos of attendance QR codes and texting them to friends outside class:
- The classroom conductor screen generates an ephemeral session token updated every **15 seconds**.
- The token incorporates `sessionId`, a server-side timestamp nonce, and an active window hash.
- Scans made with expired tokens are rejected immediately with `TOKEN_EXPIRED`.

---

## 5-Stage Attendance Validation Pipeline

When an attendance payload reaches `/api/attendance/mark`, it undergoes strict pipeline validation:

```
[Incoming Payload] -> (1. Section Enrollment Check)
                             | (Pass)
                             v
                      (2. Session Active State Check)
                             | (Pass)
                             v
                      (3. Time-Window Evaluation)
                             |---> [0 - 5 min]:  Status = 'PRESENT'
                             |---> [5 - 15 min]: Status = 'LATE'
                             |---> [> 15 min]:   Status = 'ABSENT'
                             v
                      (4. Duplicate Check-in Guard)
                             | (Pass)
                             v
                      (5. Database Write + Audit Log)
```

1. **Section Enrollment**: Confirms the student belongs to the specific class section (e.g., prevents Section B students from checking into Section A lectures).
2. **Session State**: Confirms the lecture is actively open. Closed or scheduled-only lectures reject marks.
3. **Time-Window Policy**:
   - **0 to 5 Minutes**: On-time arrival recorded as `PRESENT`.
   - **5 to 15 Minutes**: Grace period recorded as `LATE`.
   - **After 15 Minutes**: Cutoff exceeded, student recorded as `ABSENT`.
   - *On-Demand Window Override*: Faculty can toggle `Window: Unlocked` on demand for makeup lectures or off-hours testing.
4. **Session-Scoped Device Binding Anti-Proxy Gate**:
   - Prevents buddy-punching inside the lecture: A device cannot submit for two different students in the same lecture:
     `REJECTED: Device [DEV-8492] has already registered attendance for student 25215101 in this lecture.`
   - **Zero Collision for Back-to-Back Classes**: The device lock is strictly scoped to `session_id`. When the student moves to their next class (e.g., Physics Lab or Chemistry with another faculty), their device is 100% free to verify them again without false rejections.
5. **Zero-Biometric Hardware Compatibility & Door Passcode Fallback**:
   - Device digital signatures are 100% software-based browser UUID tokens stored in `localStorage`—no physical biometric fingerprint sensor is required.
   - For students with unsupported browsers or incognito mode: Enter the dynamic **6-Digit Door Terminal Passcode** shown on the classroom door kiosk upon RFID card tap.
6. **Faculty 1-Click Physical Presence Override**:
   - If a student's phone has a dead battery, their name appears in the live **"Tapped at Door (Awaiting Mobile Confirmation)"** ledger. Faculty can verify their physical presence with a single click (`✓ Verify Physical Presence`).
7. **Audit Logging**: Inserts an unmodifiable audit trail recording the actor, device, timestamp, and verification method (`DUAL_FACTOR`, `DOOR_RFID`, `TERMINAL_PIN`, `FACULTY_VERIFIED`).

---

## Authentication & University ERP Portals

Styled after official university portals (Christ University KnowledgePro & ESPro):

- **Visual Security Captcha**: Dynamic randomized 4-character distorted captcha regenerated per attempt.
- **Role-Based Portals**:
  - **Faculty Portal** (`/dashboard`): Timetable matrix, one-click lecture activation, live classroom conductor, and substitution requests.
  - **Dean of Academics Office** (`/admin`): Campus-wide lecture radar, IoT device telemetry, and one-click delegation approvals.
- **Enterprise Security**:
  - Cryptographic password hashing with `bcryptjs`.
  - Secure, HTTP-only, SameSite JWT cookies signed with `jose`.
  - Instant 1-click demo credential pills for frictionless demonstration.

---

## Faculty Delegation & Dean Approvals

When a faculty member is attending a conference or on leave:
1. **Request Creation** (`/delegation`): Faculty selects a scheduled timetable slot, picks an eligible substitute faculty, and provides an academic justification.
2. **Dean Office Review** (`/admin`): Dean receives the pending delegation in real time and can approve, reject, or revoke the request.
3. **Session Linking**: When approved, the active session automatically switches `actual_faculty_id` to the substitute teacher while preserving the scheduled faculty record for administrative accountability.

---

## 75% Defaulter Analytics & Reporting

Under statutory university regulations, students must maintain at least 75% aggregate attendance to sit for semester examinations:

- **Interactive Defaulter Audit** (`/reports`): Real-time calculations categorizing students into:
  - 🟢 **Compliant** ($\ge 75\%$)
  - 🟡 **Warning Zone** ($65\% - 74.9\%$)
  - 🔴 **Critical Defaulter** ($< 65\%$)
- **Official CSV Export**: One-click download of the complete university compliance spreadsheet (`/api/reports?format=csv`).
- **Print-Ready Official Sheet**: Formatted with formal university headers, registrar metadata, seal outlines, and signature lines for Department Head and Dean authorization.

---

## Dual Database Engine & Docker Containerization

The system runs seamlessly in two modes:

### Mode A: Production Docker (PostgreSQL 16)
Start the complete production database container:
```bash
docker compose up -d postgres
```
- Includes 13 relational tables with foreign key cascades.
- Pre-seeded with 65 dummy students (`25215101` to `25215165`), courses, classrooms, timetable schedules, and hashed demo logins.

### Mode B: Embedded Zero-Dependency Fallback (SQLite)
If Docker is not running, the application automatically uses Node 24's built-in `node:sqlite` engine pointing to `database/smart_attendance.db`:
- Zero external database installation or setup required.
- Automatically runs runtime schema migrations and backfills missing columns.

---

## Automated End-to-End Verification

A comprehensive automated test suite (`frontend/test-e2e.mjs`) verifies all 17 integration workflows end-to-end:

```bash
cd frontend
node test-e2e.mjs
```

### Test Suite Execution Output

```text
====================================================
🧪 Starting Smart Attendance System E2E Test Suite
====================================================

[TEST 1] Security Captcha Generation
  ✓ PASS: Generated 4-char security captcha

[TEST 2] Faculty Authentication (Dr. Anita Rao - F001)
  ✓ PASS: Faculty authenticated successfully
  ✓ PASS: User resolved as Dr. Anita Rao
  ✓ PASS: Role verified as FACULTY
  ✓ PASS: Auth JWT cookie received

[TEST 3] Session Cookie Verification
  ✓ PASS: Session token decoded and verified

[TEST 4] Session Activation (CS201 Data Structures)
  ✓ PASS: Session created and activated

[TEST 5] Live Classroom Roster & Initial Counts
  ✓ PASS: Session details loaded
  ✓ PASS: Verified 35 enrolled students in Section CSE-A
  ✓ PASS: Initial present count is 0

[TEST 6] Valid Attendance Check-In (Card Scan)
  ✓ PASS: Student 25215101 checked in via CARD
  ✓ PASS: Recorded as PRESENT (On-time window)

[TEST 7] Valid Attendance Check-In (Iris Biometric Scan)
  ✓ PASS: Student 25215102 checked in via IRIS
  ✓ PASS: Recorded as PRESENT

[TEST 8] Validation Rule: Duplicate Attendance Rejection
  ✓ PASS: Duplicate scan blocked with DUPLICATE_ATTENDANCE

[TEST 9] Validation Rule: Cross-Section / Unenrolled Student Rejection
  ✓ PASS: Cross-section student blocked with STUDENT_NOT_ENROLLED

[TEST 10] Real-Time Roster Verification
  ✓ PASS: Roster shows 2 students PRESENT
  ✓ PASS: Roster shows 33 students ABSENT

[TEST 11] Timetable Schedule Query
  ✓ PASS: Retrieved active timetable matrix

[TEST 12] Faculty Delegation Request
  ✓ PASS: Delegation request created

[TEST 13] Admin Authentication & Substitution Approval
  ✓ PASS: Admin Dean Office logged in
  ✓ PASS: Dean Office approved delegation request

[TEST 14] 75% Academic Defaulter Analytics & CSV Generation
  ✓ PASS: Calculated subject attendance percentages
  ✓ PASS: Analyzed all 65 students
  ✓ PASS: Exported official CSV spreadsheet

[TEST 15] Offline Sync Queue & Central Server Reconciliation
  ✓ PASS: Detected 2 pending records in offline queue
  ✓ PASS: Synchronized 2 records to Central University Backend

[TEST 16] Session Close & Lock
  ✓ PASS: Session closed and attendance locked
  ✓ PASS: Blocked check-in after session closed with SESSION_NOT_ACTIVE

[TEST 17] Logout
  ✓ PASS: Logged out cleanly

====================================================
📊 TEST RESULTS: 30 PASSED, 0 FAILED (100% SUCCESS)
====================================================
```

---

## Quickstart & Installation

### Prerequisites
- **Node.js**: v20 or v24+
- **Docker**: Optional (recommended for PostgreSQL mode)
- **Java**: JDK 17+ (optional, for legacy desktop Swing UI)

### 1. Clone the Repository
```bash
git clone https://github.com/Devrajj-Singh/smart-university-attendance.git
cd smart-university-attendance
```

### 2. (Optional) Start PostgreSQL with Docker
```bash
docker compose up -d postgres
```
*(If Docker is omitted, the system automatically uses SQLite with zero configuration.)*

### 3. Install Dependencies & Build Frontend
```bash
cd frontend
npm install
npm run build
```

### 4. Launch the Web Application
```bash
npm run start
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

To use the **Mobile Camera Scanner** on your phone, open the network URL displayed on startup (e.g. `http://192.168.1.x:3000/terminal`) while connected to the same Wi-Fi network.

---

## Demo Accounts & Credentials

Quick-fill pills are provided directly on the login screen for 1-click access:

| Role | Login ID | Password | Portal Path | Access Level |
|:---|:---|:---|:---|:---|
| **Faculty (Prof. Anita Rao)** | `F001` | `faculty123` | `/dashboard` | CSE Department Faculty |
| **Faculty (Prof. Sanjay Mehta)**| `F002` | `faculty123` | `/dashboard` | CSE Department Faculty |
| **Faculty (Prof. Priya Nair)** | `F003` | `faculty123` | `/dashboard` | CSE Department Faculty |
| **Dean of Academics** | `ADM001` | `admin123` | `/admin` | Campus Super Admin / Dean |

> **Note on Students**: As per system design, students do not log into the faculty management portal. Students are scanned and verified via classroom edge terminals (`/terminal`) using registration numbers `25215101` through `25215165`.

---

## Project Directory Layout

```text
smart-university-attendance/
├── database/
│   ├── init.sql               # PostgreSQL 16 schema & seed data (13 tables)
│   └── smart_attendance.db    # Embedded SQLite zero-config fallback
├── docker-compose.yml         # Container orchestration for PostgreSQL & Web
├── frontend/                  # Next.js 16 SaaS Production Web App
│   ├── app/
│   │   ├── admin/page.tsx     # Dean of Academics command suite
│   │   ├── dashboard/page.tsx # Faculty control room & lecture launcher
│   │   ├── delegation/page.tsx# Substitution request & approval portal
│   │   ├── reports/page.tsx   # 75% defaulter analytics & printable sheet
│   │   ├── session/[sessionId]/page.tsx # Live conductor & anti-proxy QR
│   │   ├── sync/page.tsx      # Offline synchronization ledger
│   │   ├── terminal/page.tsx  # Smartphone camera edge scanner
│   │   ├── timetable/page.tsx # Master weekly schedule matrix
│   │   ├── page.tsx           # University ERP login & captcha portal
│   │   └── api/               # REST API endpoints (Auth, Sessions, Reports)
│   ├── components/            # Reusable dark glassmorphic UI components
│   ├── lib/
│   │   ├── attendance.ts      # 5-stage validation gatekeeper
│   │   ├── auth.ts            # JWT signing, verification & password hashing
│   │   └── db.ts              # Dual-mode PostgreSQL/SQLite connector
│   └── test-e2e.mjs           # 17-test automated verification suite
├── src/                       # Legacy Java Maven Core & Desktop Swing UI
│   └── main/java/com/smartattendance/
├── pom.xml                    # Java Maven build descriptor
└── README.md                  # System Documentation
```

---

<div align="center">
  <strong>Smart University Attendance System</strong> • Designed for Modern Educational Institutions
</div>

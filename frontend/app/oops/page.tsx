'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Network, 
  Layers, 
  GitBranch, 
  Cpu, 
  Copy, 
  Check, 
  Download, 
  ChevronRight, 
  Code2, 
  FileText, 
  CheckCircle2, 
  ShieldCheck, 
  Terminal, 
  BookOpen, 
  ExternalLink,
  Sparkles,
  Database,
  ArrowRight
} from 'lucide-react';

interface ClassSpec {
  name: string;
  package: string;
  stereotype?: '<<abstract>>' | '<<interface>>' | '<<singleton>>' | '<<enumeration>>';
  inheritance?: string;
  interfaces?: string[];
  fields: string[];
  methods: string[];
  oopConcepts: string[];
  ieeeJustification: string;
  sourceFile: string;
}

const CLASS_SPECS: ClassSpec[] = [
  {
    name: 'User',
    package: 'com.smartattendance.model',
    stereotype: '<<abstract>>',
    fields: ['# String userId', '# String name', '# String email'],
    methods: [
      '+ User(userId, name, email)',
      '+ getUserId() String',
      '+ getName() String',
      '+ getEmail() String',
      '+ setName(name) void',
      '+ setEmail(email) void',
      '+ getRole()* String',
      '+ displayDashboard()* String',
      '+ toString() String'
    ],
    oopConcepts: ['Abstraction (Abstract Class)', 'Encapsulation (Protected Fields & Mutators)', 'Polymorphic Interface'],
    ieeeJustification: 'Defines the generalized superclass contract for all authenticated campus actors. Enforces subclasses to implement concrete role definitions and dashboard displays without allowing direct instantiation.',
    sourceFile: 'src/main/java/com/smartattendance/model/User.java'
  },
  {
    name: 'Student',
    package: 'com.smartattendance.model',
    inheritance: 'extends User',
    fields: ['- String cardId', '- String biometricId', '- String classId'],
    methods: [
      '+ Student(userId, name, email, cardId, biometricId, classId)',
      '+ Student(regNo, name, classId)',
      '+ getCardId() String',
      '+ getBiometricId() String',
      '+ getClassId() String',
      '+ @Override getRole() String',
      '+ @Override displayDashboard() String'
    ],
    oopConcepts: ['Inheritance (IS-A User)', 'Runtime Polymorphism (@Override displayDashboard)', 'Constructor Overloading (Compile-time Polymorphism)'],
    ieeeJustification: 'Specializes User by encapsulating physical RFID card credentials and biometric iris/facial template references. Demonstrates method overriding and constructor overloading via this(...) chaining.',
    sourceFile: 'src/main/java/com/smartattendance/model/Student.java'
  },
  {
    name: 'Faculty',
    package: 'com.smartattendance.model',
    inheritance: 'extends User',
    fields: ['- String employeeCode', '- String department', '- final List<String> subjectIds'],
    methods: [
      '+ Faculty(userId, name, email, empCode, dept)',
      '+ getEmployeeCode() String',
      '+ getDepartment() String',
      '+ getSubjectIds() List<String>',
      '+ assignSubject(subjectId) void',
      '+ @Override getRole() String',
      '+ @Override displayDashboard() String'
    ],
    oopConcepts: ['Inheritance (IS-A User)', 'Encapsulation (Defensive Copying & Unmodifiable List)', 'Runtime Polymorphism'],
    ieeeJustification: 'Encapsulates pedagogical responsibilities. Prevents collection tampering by exposing subjectIds exclusively via Collections.unmodifiableList(subjectIds) while permitting addition via assignSubject().',
    sourceFile: 'src/main/java/com/smartattendance/model/Faculty.java'
  },
  {
    name: 'AttendanceValidator',
    package: 'com.smartattendance.attendance',
    stereotype: '<<interface>>',
    fields: [],
    methods: [
      '+ validateStudentExists(studentId)* Student',
      '+ validateEnrollment(student, session)* void',
      '+ validateSessionActive(session)* void',
      '+ validateWithinWindow(session, time)* void',
      '+ validateClassroom(session, roomId)* void',
      '+ validateNotDuplicate(studentId, sessionId)* void',
      '+ validateFacultyAuthorization(facultyId, session)* void',
      '+ validateFacultyAuthorization(facultyId, operation)* void',
      '+ isOnTime(session, time)* boolean'
    ],
    oopConcepts: ['Pure Abstraction (Interface)', 'Method Overloading (Compile-Time Polymorphism)', 'Strategy Pattern Hook'],
    ieeeJustification: 'Decouples validation criteria from the core AttendanceService engine. Declares overloaded authorization methods allowing the validation ruleset to be swapped without modifying dependent service code.',
    sourceFile: 'src/main/java/com/smartattendance/attendance/AttendanceValidator.java'
  },
  {
    name: 'AttendanceService',
    package: 'com.smartattendance.attendance',
    interfaces: ['implements StudentAttendanceOperations', 'implements FacultyDashboardOperations'],
    fields: [
      '- final TimetableService timetableService',
      '- final AttendanceValidator validator',
      '- final AttendanceSessionRepository sessionRepository',
      '- final AttendanceRecordRepository recordRepository',
      '- final StudentRepository studentRepository',
      '- final AttendanceReportService reportService'
    ],
    methods: [
      '+ AttendanceService()',
      '+ AttendanceService(timetableRepo, sessionRepo, recordRepo, studentRepo)',
      '+ AttendanceService(timetableSvc, validator, sessionRepo, recordRepo, studentRepo, reportSvc)',
      '+ processAuthenticatedStudent(student, session, method) AttendanceRecord',
      '+ getActiveSession(classroomId) AttendanceSession',
      '+ getTodaysClasses(classId, today) List<TimetableSlot>',
      '+ startAutomaticSession(facultyId, roomId, time) AttendanceSession',
      '+ closeSession(sessionId, requestingFacultyId) void'
    ],
    oopConcepts: [
      'Multiple Interface Realization (Interface Segregation Principle)',
      'Constructor Overloading & Dependency Injection',
      'Composition & Aggregation (HAS-A Repositories & Validator)'
    ],
    ieeeJustification: 'Implements the Facade and Service Layer patterns. Fulfills the Interface Segregation Principle (ISP) by exposing separate contracts to authentication callers and faculty dashboard controllers.',
    sourceFile: 'src/main/java/com/smartattendance/attendance/AttendanceService.java'
  },
  {
    name: 'AttendanceException',
    package: 'com.smartattendance.exceptions',
    stereotype: '<<abstract>>',
    inheritance: 'extends Exception',
    fields: [],
    methods: [
      '+ AttendanceException(message)',
      '+ AttendanceException(message, cause)'
    ],
    oopConcepts: ['Hierarchical Exception Abstraction', 'Polymorphic Exception Handling'],
    ieeeJustification: 'Serves as the root checked exception for the attendance business domain. Allows upstream callers to catch all domain errors polymorphically while mandating concrete sub-exceptions at throw sites.',
    sourceFile: 'src/main/java/com/smartattendance/exceptions/AttendanceException.java'
  },
  {
    name: 'DatabaseManager',
    package: 'com.smartattendance.database',
    stereotype: '<<singleton>>',
    fields: [
      '- static final String DB_URL$',
      '- static DatabaseManager instance$',
      '- final Connection connection'
    ],
    methods: [
      '- DatabaseManager()',
      '+ static synchronized getInstance()$ DatabaseManager',
      '+ getConnection() Connection',
      '+ initializeSchema() void'
    ],
    oopConcepts: ['Singleton Design Pattern', 'Encapsulation of JDBC State', 'Thread-Safe Lazy Initialization'],
    ieeeJustification: 'Guarantees exactly one database connection instance exists system-wide. Private constructor prevents uncoordinated instantiations, while synchronized getInstance() provides global thread-safe access.',
    sourceFile: 'src/main/java/com/smartattendance/database/DatabaseManager.java'
  }
];

const MERMAID_CHART_CODE = `classDiagram
    direction TB

    %% PACKAGE: com.smartattendance.model
    class User {
        <<abstract>>
        #String userId
        #String name
        #String email
        +User(userId, name, email)
        +getUserId() String
        +getName() String
        +getEmail() String
        +setName(name) void
        +setEmail(email) void
        +getRole()* String
        +displayDashboard()* String
        +toString() String
    }

    class Student {
        -String cardId
        -String biometricId
        -String classId
        +Student(userId, name, email, cardId, biometricId, classId)
        +Student(regNo, name, classId)
        +getCardId() String
        +getBiometricId() String
        +getClassId() String
        +getRole() String
        +displayDashboard() String
    }

    class Faculty {
        -String employeeCode
        -String department
        -List~String~ subjectIds
        +Faculty(userId, name, email, empCode, dept)
        +getEmployeeCode() String
        +getDepartment() String
        +getSubjectIds() List~String~
        +assignSubject(subjectId) void
        +getRole() String
        +displayDashboard() String
    }

    class Admin {
        -String accessLevel
        +Admin(userId, name, email, accessLevel)
        +getAccessLevel() String
        +setAccessLevel(level) void
        +getRole() String
        +displayDashboard() String
    }

    class AttendanceSession {
        -String sessionId
        -Subject subject
        -ClassSection classSection
        -Classroom classroom
        -Faculty scheduledFaculty
        -Faculty actualFaculty
        -LocalDateTime startTime
        -LocalDateTime endTime
        -SessionStatus status
        -SessionType sessionType
        +AttendanceSession(id, subject, section, room, scheduled, actual, start, end, status)
        +AttendanceSession(id, subjectId, classId, roomId, facultyId, start, end, type)
        +getSessionId() String
        +getStatus() SessionStatus
        +setStatus(status) void
    }

    class AttendanceRecord {
        -String recordId
        -String sessionId
        -String studentId
        -LocalDateTime timestamp
        -AttendanceStatus status
        -String authMethod
        -String deviceId
        +AttendanceRecord(id, sessionId, studentId, time, status, method, deviceId)
        +getStatus() AttendanceStatus
    }

    User <|-- Student : Inheritance (IS-A)
    User <|-- Faculty : Inheritance (IS-A)
    User <|-- Admin : Inheritance (IS-A)

    AttendanceSession *-- Faculty : Aggregation
    AttendanceRecord o-- AttendanceSession : Foreign Key

    %% PACKAGE: com.smartattendance.attendance
    class AttendanceValidator {
        <<interface>>
        +validateStudentExists(studentId)* Student
        +validateEnrollment(student, session)* void
        +validateSessionActive(session)* void
        +validateWithinWindow(session, time)* void
        +validateClassroom(session, roomId)* void
        +validateNotDuplicate(studentId, sessionId)* void
        +validateFacultyAuthorization(facultyId, session)* void
        +validateFacultyAuthorization(facultyId, operation)* void
        +isOnTime(session, time)* boolean
    }

    class DefaultAttendanceValidator {
        -StudentRepository studentRepository
        -AttendanceRecordRepository recordRepository
        -AttendanceWindowConfig windowConfig
        +DefaultAttendanceValidator(studentRepo, recordRepo, config)
        +validateStudentExists(studentId) Student
        +validateEnrollment(student, session) void
        +validateSessionActive(session) void
        +validateWithinWindow(session, time) void
        +validateFacultyAuthorization(facultyId, session) void
        +validateFacultyAuthorization(facultyId, operation) void
    }

    class StudentAttendanceOperations {
        <<interface>>
        +processAuthenticatedStudent(student, session, method)* AttendanceRecord
        +getActiveSession(classroomId)* AttendanceSession
        +validateStudentForSession(studentId, sessionId)* void
    }

    class FacultyDashboardOperations {
        <<interface>>
        +getTodaysClasses(classId, today)* List~TimetableSlot~
        +startAutomaticSession(facultyId, roomId, time)* AttendanceSession
        +startManualSession(subjectId, classId, roomId, facultyId, start, end)* AttendanceSession
        +getAttendanceSummary(sessionId)* Map~String, Object~
        +closeSession(sessionId, requestingFacultyId)* void
    }

    class AttendanceService {
        -TimetableService timetableService
        -AttendanceValidator validator
        -AttendanceSessionRepository sessionRepository
        -AttendanceRecordRepository recordRepository
        -StudentRepository studentRepository
        -AttendanceReportService reportService
        +AttendanceService()
        +AttendanceService(timetableRepo, sessionRepo, recordRepo, studentRepo)
        +AttendanceService(timetableSvc, validator, sessionRepo, recordRepo, studentRepo, reportSvc)
        +processAuthenticatedStudent(student, session, method) AttendanceRecord
        +getActiveSession(classroomId) AttendanceSession
        +getTodaysClasses(classId, today) List~TimetableSlot~
        +startAutomaticSession(facultyId, roomId, time) AttendanceSession
    }

    AttendanceValidator <|.. DefaultAttendanceValidator : Realization
    StudentAttendanceOperations <|.. AttendanceService : Realization (ISP)
    FacultyDashboardOperations <|.. AttendanceService : Realization (ISP)
    AttendanceService o-- AttendanceValidator : Dependency Injection

    %% PACKAGE: com.smartattendance.exceptions
    class AttendanceException {
        <<abstract>>
        +AttendanceException(message)
        +AttendanceException(message, cause)
    }

    class DuplicateAttendanceException {
        -String studentId
        -String sessionId
        +DuplicateAttendanceException(studentId, sessionId)
    }

    class AttendanceWindowClosedException {
        -String sessionId
        -LocalDateTime attemptTime
        +AttendanceWindowClosedException(sessionId, attemptTime)
    }

    class StudentNotEnrolledException {
        -String studentId
        -String classId
        +StudentNotEnrolledException(studentId, classId)
    }

    class UnauthorizedFacultyException {
        -String facultyId
        -String action
        +UnauthorizedFacultyException(facultyId, action)
    }

    Exception <|-- AttendanceException : Extends Java Exception
    AttendanceException <|-- DuplicateAttendanceException : Specialization
    AttendanceException <|-- AttendanceWindowClosedException : Specialization
    AttendanceException <|-- StudentNotEnrolledException : Specialization
    AttendanceException <|-- UnauthorizedFacultyException : Specialization

    %% PACKAGE: com.smartattendance.database
    class DatabaseManager {
        -String DB_URL$
        -DatabaseManager instance$
        -Connection connection
        -DatabaseManager()
        +getInstance()$ DatabaseManager
        +getConnection() Connection
        +initializeSchema() void
    }

    class StudentRepository {
        -Connection connection
        +StudentRepository()
        +insert(student) void
        +findById(userId) Student
    }

    StudentRepository ..> DatabaseManager : Singleton Call
    DefaultAttendanceValidator o-- StudentRepository : Composition`;

export default function OOPArchitecturePage() {
  const [selectedClass, setSelectedClass] = useState<ClassSpec>(CLASS_SPECS[0]);
  const [activeTab, setActiveTab] = useState<'ALL' | 'INHERITANCE' | 'POLYMORPHISM' | 'ABSTRACTION' | 'ENCAPSULATION' | 'PATTERNS'>('ALL');
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(MERMAID_CHART_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredSpecs = activeTab === 'ALL'
    ? CLASS_SPECS
    : CLASS_SPECS.filter(spec => {
        if (activeTab === 'INHERITANCE') return spec.inheritance || spec.name === 'User';
        if (activeTab === 'POLYMORPHISM') return spec.oopConcepts.some(c => c.includes('Polymorphism'));
        if (activeTab === 'ABSTRACTION') return spec.stereotype === '<<abstract>>' || spec.stereotype === '<<interface>>';
        if (activeTab === 'ENCAPSULATION') return spec.oopConcepts.some(c => c.includes('Encapsulation'));
        if (activeTab === 'PATTERNS') return spec.stereotype === '<<singleton>>' || spec.interfaces;
        return true;
      });

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 sm:p-6 lg:p-8 font-sans selection:bg-indigo-600 selection:text-white">
      {/* Top Breadcrumb Navigation */}
      <div className="max-w-7xl mx-auto mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div className="flex items-center space-x-2 text-xs text-zinc-400">
          <Link href="/dashboard" className="hover:text-white transition-colors">SmartCampus ERP</Link>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
          <Link href="/architecture" className="hover:text-white transition-colors">System Architecture</Link>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
          <span className="text-indigo-400 font-semibold font-mono">/oops (IEEE UML Specification)</span>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleCopyCode}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied Mermaid Code!' : 'Copy IEEE Mermaid Code'}</span>
          </button>

          <Link
            href="/architecture"
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 transition-all"
          >
            <Network className="w-3.5 h-3.5 text-indigo-400" />
            <span>Interactive Data Flow</span>
          </Link>
        </div>
      </div>

      {/* IEEE Academic Header Card */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-zinc-900 via-indigo-950/40 to-zinc-900 border border-zinc-800/80 p-6 sm:p-8 shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-4xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-mono font-medium mb-3">
              <BookOpen className="w-3.5 h-3.5" />
              <span>IEEE Std 1471-2000 Academic Class Modeling Specification</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
              Java Object-Oriented Architecture & UML Class Diagram
            </h1>
            <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
              Formal IEEE-standard documentation of all Java OOP concepts utilized across <code className="text-indigo-300 font-mono">com.smartattendance.*</code>. Covers Abstract Base Classes, Hierarchical Inheritance, Compile-time & Runtime Polymorphism, Data Encapsulation, Checked Exception Hierarchies, and Creational/Structural Design Patterns.
            </p>
          </div>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="max-w-7xl mx-auto mb-6 flex flex-wrap items-center gap-2">
        {[
          { id: 'ALL', label: 'All Architecture (Full UML)' },
          { id: 'INHERITANCE', label: '1. Inheritance (Hierarchy)' },
          { id: 'POLYMORPHISM', label: '2. Polymorphism (Overriding & Overloading)' },
          { id: 'ABSTRACTION', label: '3. Abstraction (Contracts & Interfaces)' },
          { id: 'ENCAPSULATION', label: '4. Encapsulation & Data Hiding' },
          { id: 'PATTERNS', label: '5. Design Patterns (Singleton & ISP)' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'bg-white text-black font-bold shadow-md'
                : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border border-zinc-800 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Content Grid: Left Raw IEEE Mermaid Code & Right Interactive Class Inspector */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start mb-12">
        
        {/* Left: Complete IEEE Mermaid Code Canvas (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-5 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-3">
              <div className="flex items-center space-x-2">
                <Code2 className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-mono uppercase tracking-wider text-zinc-300 font-bold">
                  IEEE Mermaid UML Class Diagram Code
                </span>
              </div>
              <button
                onClick={handleCopyCode}
                className="flex items-center space-x-1 text-[11px] font-mono text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Diagram'}</span>
              </button>
            </div>

            {/* Mermaid Raw Code Box */}
            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/80 font-mono text-[11px] text-zinc-300 overflow-x-auto max-h-[580px] scrollbar-thin leading-relaxed">
              <pre>{MERMAID_CHART_CODE}</pre>
            </div>
            
            <p className="text-[11px] text-zinc-500 mt-3 font-mono">
              💡 Tip: Copy and paste this directly into Mermaid Live Editor, GitHub, Notion, Overleaf LaTeX, or any Markdown renderer.
            </p>
          </div>
        </div>

        {/* Right: Interactive Class Spec Inspector (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-4">
              <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-bold">
                Select Class to Inspect OOP Invariants
              </span>
              <span className="text-[10px] text-zinc-500 font-mono">{filteredSpecs.length} classes available</span>
            </div>

            {/* Class Pill Selector */}
            <div className="flex flex-wrap gap-2 mb-4">
              {filteredSpecs.map((spec) => (
                <button
                  key={spec.name}
                  onClick={() => setSelectedClass(spec)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all cursor-pointer ${
                    selectedClass.name === spec.name
                      ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30'
                      : 'bg-zinc-950 hover:bg-zinc-800 text-zinc-400 border border-zinc-800'
                  }`}
                >
                  {spec.stereotype ? `${spec.stereotype} ` : ''}{spec.name}
                </button>
              ))}
            </div>

            {/* Selected Class Details Card */}
            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/80 space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-indigo-400 uppercase">
                    {selectedClass.package}
                  </span>
                  {selectedClass.stereotype && (
                    <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
                      {selectedClass.stereotype}
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-bold text-white mt-1">
                  {selectedClass.name}
                </h3>
                {selectedClass.inheritance && (
                  <p className="text-xs font-mono text-emerald-400 mt-0.5">{selectedClass.inheritance}</p>
                )}
                {selectedClass.interfaces && selectedClass.interfaces.map((intf, i) => (
                  <p key={i} className="text-xs font-mono text-blue-400 mt-0.5">{intf}</p>
                ))}
              </div>

              {/* OOP Concepts List */}
              <div>
                <span className="text-[10px] font-mono uppercase text-zinc-500 block mb-1.5 font-bold">
                  Applied OOP Concepts
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedClass.oopConcepts.map((concept, i) => (
                    <span key={i} className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-950/60 text-indigo-300 border border-indigo-800/40">
                      {concept}
                    </span>
                  ))}
                </div>
              </div>

              {/* IEEE Architecture Justification */}
              <div>
                <span className="text-[10px] font-mono uppercase text-zinc-500 block mb-1 font-bold">
                  IEEE Design Justification
                </span>
                <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-900/50 p-3 rounded-xl border border-zinc-800">
                  {selectedClass.ieeeJustification}
                </p>
              </div>

              {/* Attributes & Methods */}
              {selectedClass.fields.length > 0 && (
                <div>
                  <span className="text-[10px] font-mono uppercase text-zinc-500 block mb-1 font-bold">
                    Fields & Visibility Modifiers
                  </span>
                  <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800/80 font-mono text-[10px] text-zinc-300 space-y-0.5">
                    {selectedClass.fields.map((f, i) => (
                      <div key={i}>{f}</div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <span className="text-[10px] font-mono uppercase text-zinc-500 block mb-1 font-bold">
                  Key Methods
                </span>
                <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800/80 font-mono text-[10px] text-zinc-300 space-y-1 max-h-40 overflow-y-auto scrollbar-thin">
                  {selectedClass.methods.map((m, i) => (
                    <div key={i} className={m.includes('@Override') ? 'text-amber-400 font-semibold' : ''}>{m}</div>
                  ))}
                </div>
              </div>

              {/* Source File Link */}
              <div className="pt-2 border-t border-zinc-900 flex items-center justify-between text-[11px] font-mono text-zinc-500">
                <span>Source File:</span>
                <span className="text-zinc-300">{selectedClass.sourceFile}</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* IEEE Specification Table (Paper Style) */}
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="p-6 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-2xl">
          <div className="flex items-center space-x-2 mb-4">
            <FileText className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white uppercase tracking-wider font-mono">
              Table I: Mapping of OOP Pillars to Core System Classes
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400 text-[11px]">
                  <th className="py-3 px-4 font-bold uppercase">OOP Concept</th>
                  <th className="py-3 px-4 font-bold uppercase">Design Invariant</th>
                  <th className="py-3 px-4 font-bold uppercase">Concrete Class / Interface</th>
                  <th className="py-3 px-4 font-bold uppercase">Academic Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                <tr className="hover:bg-zinc-800/30 transition-colors">
                  <td className="py-3 px-4 text-indigo-400 font-bold">Abstraction</td>
                  <td className="py-3 px-4">Separation of contract from operational implementation</td>
                  <td className="py-3 px-4 font-semibold text-white">User.java, AttendanceValidator.java, StudentAttendanceOperations.java</td>
                  <td className="py-3 px-4 text-zinc-500">com.smartattendance.model.User</td>
                </tr>
                <tr className="hover:bg-zinc-800/30 transition-colors">
                  <td className="py-3 px-4 text-emerald-400 font-bold">Inheritance</td>
                  <td className="py-3 px-4">Hierarchical generalization with code reuse (IS-A)</td>
                  <td className="py-3 px-4 font-semibold text-white">Student, Faculty, Admin extend User; Exceptions extend AttendanceException</td>
                  <td className="py-3 px-4 text-zinc-500">com.smartattendance.model.Student</td>
                </tr>
                <tr className="hover:bg-zinc-800/30 transition-colors">
                  <td className="py-3 px-4 text-amber-400 font-bold">Runtime Polymorphism</td>
                  <td className="py-3 px-4">Dynamic method dispatch via @Override annotations</td>
                  <td className="py-3 px-4 font-semibold text-white">displayDashboard() & getRole() across User subclasses</td>
                  <td className="py-3 px-4 text-zinc-500">User.java:L46-54</td>
                </tr>
                <tr className="hover:bg-zinc-800/30 transition-colors">
                  <td className="py-3 px-4 text-amber-400 font-bold">Compile-time Polymorphism</td>
                  <td className="py-3 px-4">Method & constructor signature overloading</td>
                  <td className="py-3 px-4 font-semibold text-white">validateFacultyAuthorization(...) in AttendanceValidator; Student(...) constructors</td>
                  <td className="py-3 px-4 text-zinc-500">AttendanceValidator.java:L30-35</td>
                </tr>
                <tr className="hover:bg-zinc-800/30 transition-colors">
                  <td className="py-3 px-4 text-purple-400 font-bold">Encapsulation</td>
                  <td className="py-3 px-4">Defensive copies & unmodifiable collection wrappers</td>
                  <td className="py-3 px-4 font-semibold text-white">Collections.unmodifiableList(subjectIds) in Faculty.java</td>
                  <td className="py-3 px-4 text-zinc-500">Faculty.java:L38-40</td>
                </tr>
                <tr className="hover:bg-zinc-800/30 transition-colors">
                  <td className="py-3 px-4 text-blue-400 font-bold">Composition</td>
                  <td className="py-3 px-4">Loose coupling through component assembly (HAS-A)</td>
                  <td className="py-3 px-4 font-semibold text-white">AttendanceSession HAS-A Subject, ClassSection, Classroom, Faculty</td>
                  <td className="py-3 px-4 text-zinc-500">AttendanceSession.java:L22-26</td>
                </tr>
                <tr className="hover:bg-zinc-800/30 transition-colors">
                  <td className="py-3 px-4 text-rose-400 font-bold">Singleton Pattern</td>
                  <td className="py-3 px-4">Single point of database connectivity with private constructor</td>
                  <td className="py-3 px-4 font-semibold text-white">DatabaseManager.getInstance()</td>
                  <td className="py-3 px-4 text-zinc-500">DatabaseManager.java:L25-52</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Footer Meta */}
      <div className="max-w-7xl mx-auto mt-12 pt-6 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-4 text-xs text-zinc-500 font-mono">
        <div>SmartCampus v3.0 OOP Specification • IEEE Std 1471-2000 Compliant</div>
        <div className="flex items-center space-x-4">
          <Link href="/architecture" className="hover:text-zinc-300 transition-colors">E2E Architecture</Link>
          <Link href="/terminal" className="hover:text-zinc-300 transition-colors">Door Kiosk</Link>
          <Link href="/dashboard" className="hover:text-zinc-300 transition-colors">Faculty Dashboard</Link>
          <Link href="/admin" className="hover:text-zinc-300 transition-colors">Dean Console</Link>
        </div>
      </div>
    </div>
  );
}

package com.smartattendance.ui;

import com.smartattendance.attendance.AttendanceReportService;
import com.smartattendance.attendance.AttendanceService;
import com.smartattendance.attendance.TimetableService;
import com.smartattendance.attendance.AttendanceWindowConfig;
import com.smartattendance.attendance.DefaultAttendanceValidator;
import com.smartattendance.authentication.AuthenticationResult;
import com.smartattendance.authentication.AuthenticationService;
import com.smartattendance.authentication.IDCardAuthentication;
import com.smartattendance.authentication.IrisAuthentication;
import com.smartattendance.dashboard.FacultyDelegationService;
import com.smartattendance.dashboard.LoginService;
import com.smartattendance.database.repository.AttendanceRecordRepository;
import com.smartattendance.database.repository.AttendanceRepository;
import com.smartattendance.database.repository.AttendanceSessionRepository;
import com.smartattendance.database.repository.ClassSectionRepository;
import com.smartattendance.database.repository.ClassroomRepository;
import com.smartattendance.database.repository.FacultyRepository;
import com.smartattendance.database.repository.StudentRepository;
import com.smartattendance.database.repository.SubjectRepository;
import com.smartattendance.database.repository.TimetableRepository;
import com.smartattendance.model.AttendanceRecord;
import com.smartattendance.model.AttendanceSession;
import com.smartattendance.model.BiometricDevice;
import com.smartattendance.model.Faculty;
import com.smartattendance.model.Student;
import com.smartattendance.model.Subject;
import com.smartattendance.model.ClassSection;
import com.smartattendance.model.Classroom;
import com.smartattendance.model.TimetableSlot;
import com.smartattendance.sync.SyncService;
import com.smartattendance.sync.UniversityAttendanceBackend;

import java.io.File;
import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.function.Consumer;

/**
 * The application context composes the existing backend services and supplies
 * shared UI state. It performs NO business logic of its own: every change flows
 * through the existing service/repository layer. It adds a small event channel
 * so the Device Simulator can push simulated hardware results into the live
 * Attendance screen without touching the database itself.
 */
public final class AppContext {

    // ---- services (single instances, backed by the existing DB) ----
    private final AttendanceService attendanceService;
    private final TimetableService timetableService;
    private final AuthenticationService authenticationService;
    private final IDCardAuthentication cardAuthentication;
    private final IrisAuthentication irisAuthentication;
    private final LoginService loginService;
    private final SyncService syncService;
    private final UniversityAttendanceBackend backend;
    private final FacultyDelegationService delegationService;
    private final AttendanceReportService reportService;

    // ---- repositories (read-only presentation data) ----
    private final StudentRepository studentRepository;
    private final FacultyRepository facultyRepository;
    private final SubjectRepository subjectRepository;
    private final ClassSectionRepository classSectionRepository;
    private final ClassroomRepository classroomRepository;
    private final TimetableRepository timetableRepository;
    private final AttendanceSessionRepository sessionRepository;
    private final AttendanceRecordRepository recordRepository;

    // ---- simulated hardware ----
    private final BiometricDevice cardDevice;
    private final BiometricDevice irisDevice;

    // ---- shared session state ----
    private Faculty currentFaculty;
    private AttendanceSession activeSession;
    private TimetableSlot activeSlot;
    private LocalDateTime lastSyncTime;
    private Runnable onUiStateChanged;

    // ---------------------------------------------------------------
    // UI state change notifications (keeps the top bar / status in sync)
    // ---------------------------------------------------------------

    public void setOnUiStateChanged(Runnable listener) {
        this.onUiStateChanged = listener;
    }

    public void notifyUiStateChanged() {
        if (onUiStateChanged != null) {
            onUiStateChanged.run();
        }
    }

    // ---------------------------------------------------------------
    // simulated hardware event channel
    // ---------------------------------------------------------------
    private final List<Consumer<AuthenticationResult>> cardResultListeners = new CopyOnWriteArrayList<>();
    private final List<Consumer<AuthenticationResult>> irisResultListeners = new CopyOnWriteArrayList<>();

    public AppContext() {
        AttendanceRepository attendanceRepository = new AttendanceRepository();
        this.sessionRepository = new AttendanceSessionRepository(attendanceRepository);
        this.recordRepository = new AttendanceRecordRepository(attendanceRepository);
        this.studentRepository = new StudentRepository();
        this.facultyRepository = new FacultyRepository();
        this.subjectRepository = new SubjectRepository();
        this.classSectionRepository = new ClassSectionRepository();
        this.classroomRepository = new ClassroomRepository();
        this.timetableRepository = new TimetableRepository();

        this.timetableService = new TimetableService(timetableRepository);
        this.attendanceService = new AttendanceService(
                timetableService,
                new DefaultAttendanceValidator(studentRepository, recordRepository, AttendanceWindowConfig.defaultConfig()),
                sessionRepository,
                recordRepository,
                studentRepository,
                new AttendanceReportService(recordRepository));
        this.reportService = new AttendanceReportService(recordRepository);
        this.cardAuthentication = new IDCardAuthentication();
        this.irisAuthentication = new IrisAuthentication();
        this.authenticationService = new AuthenticationService(attendanceService);
        this.loginService = new LoginService();
        this.backend = new UniversityAttendanceBackend();
        this.syncService = new SyncService(attendanceRepository, backend);
        this.delegationService = new FacultyDelegationService();

        registerStudentCredentials();

        this.cardDevice = new BiometricDevice("CARD-READER-ROOM001", "ROOM001", "CARD_READER",
                BiometricDevice.DeviceStatus.ONLINE, LocalDateTime.now());
        this.irisDevice = new BiometricDevice("IRIS-SCANNER-ROOM001", "ROOM001", "IRIS_SCANNER",
                BiometricDevice.DeviceStatus.ONLINE, LocalDateTime.now());
    }

    private void registerStudentCredentials() {
        for (Student student : studentRepository.findAll()) {
            cardAuthentication.registerCard(student.getRegistrationNumber(), student.getCardUid());
            irisAuthentication.registerBiometric(student.getRegistrationNumber(), student.getBiometricId());
        }
    }

    // ---------------------------------------------------------------
    // Services exposed to the UI
    // ---------------------------------------------------------------

    public AttendanceService attendance() {
        return attendanceService;
    }

    public AuthenticationService authentication() {
        return authenticationService;
    }

    public LoginService login() {
        return loginService;
    }

    public SyncService sync() {
        return syncService;
    }

    public FacultyDelegationService delegation() {
        return delegationService;
    }

    public AttendanceReportService reports() {
        return reportService;
    }

    public IDCardAuthentication cardAuth() {
        return cardAuthentication;
    }

    public IrisAuthentication irisAuth() {
        return irisAuthentication;
    }

    // ---------------------------------------------------------------
    // Repositories (read-only presentation lookups)
    // ---------------------------------------------------------------

    public StudentRepository students() {
        return studentRepository;
    }

    public FacultyRepository faculty() {
        return facultyRepository;
    }

    public SubjectRepository subjects() {
        return subjectRepository;
    }

    public ClassSectionRepository classSections() {
        return classSectionRepository;
    }

    public ClassroomRepository classrooms() {
        return classroomRepository;
    }

    public TimetableRepository timetable() {
        return timetableRepository;
    }

    public AttendanceSessionRepository sessions() {
        return sessionRepository;
    }

    public AttendanceRecordRepository records() {
        return recordRepository;
    }

    // ---------------------------------------------------------------
    // Read-only presentation queries (thin pass-throughs to services)
    // ---------------------------------------------------------------

    public List<AttendanceSession> todaySessionsForFaculty(String facultyId) {
        try {
            return attendanceService.getTodaysSessionsForFaculty(facultyId);
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }

    public List<TimetableSlot> slotsForFacultyDay(String facultyId, DayOfWeek day) {
        return timetableRepository.findByFacultyAndDay(facultyId, day);
    }

    public Map<String, Object> attendanceSummary(String sessionId) {
        try {
            return attendanceService.getAttendanceSummary(sessionId);
        } catch (Exception e) {
            return new HashMap<>();
        }
    }

    public List<AttendanceRecord> sessionRecords(String sessionId) {
        return recordRepository.findBySession(sessionId);
    }

    public Optional<AttendanceSession> sessionById(String sessionId) {
        return sessionRepository.findById(sessionId);
    }

    // ---------------------------------------------------------------
    // Name resolution helpers
    // ---------------------------------------------------------------

    public String subjectName(String subjectId) {
        Subject subject = subjectRepository.findById(subjectId);
        return subject != null ? subject.getSubjectName() : subjectId;
    }

    public String subjectCode(String subjectId) {
        Subject subject = subjectRepository.findById(subjectId);
        return subject != null ? subject.getSubjectCode() : subjectId;
    }

    public String className(String classId) {
        ClassSection section = classSectionRepository.findById(classId);
        return section != null ? section.getClassName() : classId;
    }

    public String roomNumber(String classroomId) {
        Classroom room = classroomRepository.findById(classroomId);
        return room != null ? room.getRoomNumber() : classroomId;
    }

    public String facultyName(String facultyId) {
        Faculty faculty = facultyRepository.findById(facultyId);
        return faculty != null ? faculty.getName() : facultyId;
    }

    public String studentName(String registrationNumber) {
        Student student = studentRepository.findById(registrationNumber);
        return student != null ? student.getName() : registrationNumber;
    }

    // ---------------------------------------------------------------
    // Session / faculty state
    // ---------------------------------------------------------------

    public Faculty getCurrentFaculty() {
        return currentFaculty;
    }

    public void setCurrentFaculty(Faculty faculty) {
        this.currentFaculty = faculty;
    }

    public AttendanceSession getActiveSession() {
        return activeSession;
    }

    public void setActiveSession(AttendanceSession session) {
        this.activeSession = session;
    }

    public TimetableSlot getActiveSlot() {
        return activeSlot;
    }

    public void setActiveSlot(TimetableSlot slot) {
        this.activeSlot = slot;
    }

    /**
     * Opens an attendance session bound to a timetable slot. Creates a fresh
     * manual session that starts one minute in the past so its attendance
     * window (start-5m .. start+15m) is always open for demonstration, then
     * wires it in as the active session. Reuses an already-active session for
     * the same slot when present.
     */
    public AttendanceSession openAttendanceForSlot(TimetableSlot slot, String facultyId) {
        if (activeSession != null && activeSession.getStatus().name().equals("ACTIVE")
                && activeSession.getSubjectId().equals(slot.getSubjectId())
                && activeSession.getClassId().equals(slot.getClassId())
                && activeSession.getClassroomId().equals(slot.getClassroomId())) {
            return activeSession;
        }
        try {
            LocalDateTime now = LocalDateTime.now();
            AttendanceSession session = attendanceService.startManualSession(
                    slot.getSubjectId(), slot.getClassId(), slot.getClassroomId(), facultyId,
                    now.minusMinutes(1), now.plusMinutes(59));
            activeSession = session;
            activeSlot = slot;
            notifyUiStateChanged();
            return session;
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * Starts a fresh manual attendance session from explicit subject/class/
     * room choices (used by the attendance panel's "New Session" form).
     */
    public AttendanceSession startManualSession(String subjectId, String classId, String classroomId, String facultyId) {
        try {
            LocalDateTime now = LocalDateTime.now();
            AttendanceSession session = attendanceService.startManualSession(
                    subjectId, classId, classroomId, facultyId,
                    now.minusMinutes(1), now.plusMinutes(59));
            activeSession = session;
            activeSlot = null;
            notifyUiStateChanged();
            return session;
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * Closes the active session through the service layer (authorization
     * validated there), then clears the local reference and notifies the UI.
     */
    public void closeActiveSession(String requestingFacultyId) {
        if (activeSession == null) {
            return;
        }
        boolean wasClosable;
        try {
            attendanceService.closeSession(activeSession.getSessionId(), requestingFacultyId);
            wasClosable = true;
        } catch (Exception e) {
            wasClosable = false;
            // surface as user-friendly message by caller
        }
        activeSession = null;
        activeSlot = null;
        if (wasClosable) {
            notifyUiStateChanged();
        }
    }

    // ---------------------------------------------------------------
    // Attendance recording (delegates to the service, then enqueues sync)
    // ---------------------------------------------------------------

    public AttendanceRecord markAttendance(Student student, AttendanceSession session, String method) throws Exception {
        AttendanceRecord record = attendanceService.markAttendance(student, session, method, LocalDateTime.now());
        syncService.enqueue(record.getRecordId());
        notifyUiStateChanged();
        return record;
    }

    // ---------------------------------------------------------------
    // Device status (simulated hardware conditions)
    // ---------------------------------------------------------------

    public BiometricDevice getCardDevice() {
        return cardDevice;
    }

    public BiometricDevice getIrisDevice() {
        return irisDevice;
    }

    public void setCardOnline(boolean online) {
        cardDevice.setStatus(online ? BiometricDevice.DeviceStatus.ONLINE : BiometricDevice.DeviceStatus.OFFLINE);
    }

    public void setIrisOnline(boolean online) {
        irisDevice.setStatus(online ? BiometricDevice.DeviceStatus.ONLINE : BiometricDevice.DeviceStatus.OFFLINE);
    }

    public boolean isCardOnline() {
        return cardDevice.isReady();
    }

    public boolean isIrisOnline() {
        return irisDevice.isReady();
    }

    // ---------------------------------------------------------------
    // Sync status (from the existing SyncService)
    // ---------------------------------------------------------------

    public void setBackendOnline(boolean online) {
        backend.setOnline(online);
    }

    public boolean isBackendOnline() {
        return backend.isOnline();
    }

    public long pendingSyncCount() {
        return syncService.getPendingCount();
    }

    public Map<String, Integer> syncStatus() {
        return syncService.getSyncStatus();
    }

    public boolean triggerSync() {
        boolean ok = syncService.synchronizeData();
        lastSyncTime = LocalDateTime.now();
        return ok;
    }

    public LocalDateTime getLastSyncTime() {
        return lastSyncTime;
    }

    // ---------------------------------------------------------------
    // Simulated hardware event channel
    // ---------------------------------------------------------------

    public void addCardResultListener(Consumer<AuthenticationResult> listener) {
        cardResultListeners.add(listener);
    }

    public void removeCardResultListener(Consumer<AuthenticationResult> listener) {
        cardResultListeners.remove(listener);
    }

    public void addIrisResultListener(Consumer<AuthenticationResult> listener) {
        irisResultListeners.add(listener);
    }

    public void removeIrisResultListener(Consumer<AuthenticationResult> listener) {
        irisResultListeners.remove(listener);
    }

    /**
     * Simulates a card being presented at the reader. Runs the card through
     * the existing IDCardAuthentication implementation; the resulting
     * AuthenticationResult is broadcast to the attendance screen. This method
     * never records attendance itself.
     */
    public void simulateCardScan(String registrationNumber) {
        Student student = studentRepository.findById(registrationNumber);
        if (student == null) {
            broadcastCardResult(new AuthenticationResult(
                    AuthenticationResult.Status.UNKNOWN_USER, null, "Unknown registration number: " + registrationNumber));
            return;
        }
        AuthenticationResult result = runAuth(() -> cardAuthentication.authenticate(student, student.getCardUid(), cardDevice));
        broadcastCardResult(result);
    }

    /**
     * Simulated iris capture that matches the enrolled template. Uses the
     * existing IrisAuthentication implementation; never records attendance.
     */
    public void simulateIrisApproved(String registrationNumber) {
        Student student = studentRepository.findById(registrationNumber);
        if (student == null) {
            broadcastIrisResult(new AuthenticationResult(
                    AuthenticationResult.Status.UNKNOWN_USER, null, "Unknown registration number: " + registrationNumber));
            return;
        }
        AuthenticationResult result = runAuth(() -> irisAuthentication.authenticate(student, student.getBiometricId(), irisDevice));
        broadcastIrisResult(result);
    }

    /**
     * Simulated iris capture that fails to match the enrolled template.
     */
    public void simulateIrisFailed(String registrationNumber) {
        Student student = studentRepository.findById(registrationNumber);
        if (student == null) {
            broadcastIrisResult(new AuthenticationResult(
                    AuthenticationResult.Status.UNKNOWN_USER, null, "Unknown registration number: " + registrationNumber));
            return;
        }
        AuthenticationResult result = runAuth(() -> irisAuthentication.authenticate(student, "CAPTURE-UNMATCHED-" + registrationNumber, irisDevice));
        broadcastIrisResult(result);
    }

    /**
     * Demonstrational iris-image association: a user-selected image maps to an
     * enrolled template only when the chosen file can be deterministically
     * associated with the registration number (simulation only, clearly not
     * real biometric recognition).
     */
    public void simulateIrisUpload(String registrationNumber, File image) {
        Student student = studentRepository.findById(registrationNumber);
        if (student == null) {
            broadcastIrisResult(new AuthenticationResult(
                    AuthenticationResult.Status.UNKNOWN_USER, null, "Unknown registration number: " + registrationNumber));
            return;
        }
        boolean associated = image != null && image.getName().contains(registrationNumber);
        String template = associated ? student.getBiometricId() : "UPLOAD-" + registrationNumber;
        AuthenticationResult result = runAuth(() -> irisAuthentication.authenticate(student, template, irisDevice));
        broadcastIrisResult(result);
    }

    private AuthenticationResult runAuth(AuthCall call) {
        try {
            return call.run();
        } catch (Exception e) {
            return new AuthenticationResult(
                    AuthenticationResult.Status.DEVICE_ERROR, null, "Device error: " + e.getMessage());
        }
    }

    @FunctionalInterface
    private interface AuthCall {
        AuthenticationResult run() throws Exception;
    }

    private void broadcastCardResult(AuthenticationResult result) {
        for (Consumer<AuthenticationResult> listener : cardResultListeners) {
            listener.accept(result);
        }
    }

    private void broadcastIrisResult(AuthenticationResult result) {
        for (Consumer<AuthenticationResult> listener : irisResultListeners) {
            listener.accept(result);
        }
    }

    public static String methodDisplayName(AttendanceRecord record) {
        if (record == null || record.getMethod() == null) {
            return "—";
        }
        switch (record.getMethod()) {
            case CARD:
                return "CARD";
            case BIOMETRIC:
                return "IRIS";
            case CARD_AND_IRIS:
                return "CARD + IRIS";
            case MANUAL:
            default:
                return "MANUAL";
        }
    }

    /**
     * Reads every enrolled registration number for a class in order.
     */
    public List<Student> studentsForClass(String classId) {
        List<Student> all = new ArrayList<>(studentRepository.findByClassId(classId));
        all.sort((a, b) -> a.getRegistrationNumber().compareTo(b.getRegistrationNumber()));
        return all;
    }

    public List<String> allFacultyIds() {
        List<String> ids = new ArrayList<>();
        for (Faculty faculty : facultyRepository.findAll()) {
            ids.add(faculty.getUserId());
        }
        return ids;
    }
}
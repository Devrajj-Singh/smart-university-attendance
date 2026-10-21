package com.smartattendance.ui;

import com.smartattendance.authentication.AuthenticationResult;
import com.smartattendance.model.AttendanceRecord;
import com.smartattendance.model.AttendanceSession;
import com.smartattendance.model.ClassSection;
import com.smartattendance.model.Classroom;
import com.smartattendance.model.Student;
import com.smartattendance.model.Subject;
import com.smartattendance.model.TimetableSlot;

import javax.swing.BorderFactory;
import javax.swing.Box;
import javax.swing.BoxLayout;
import javax.swing.JComponent;
import javax.swing.JComboBox;
import javax.swing.JLabel;
import javax.swing.JPanel;
import javax.swing.JScrollPane;
import javax.swing.JTable;
import javax.swing.JTextField;
import javax.swing.JTextArea;
import java.awt.BorderLayout;
import java.awt.Color;
import java.awt.Component;
import java.awt.Dimension;
import java.awt.Font;
import java.awt.GridLayout;
import java.awt.event.ActionEvent;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.function.Consumer;

/**
 * The live attendance capture screen.
 *
 * One of three authentication flows may be selected, all backed by the
 * existing authentication services via the shared hardware-event channel:
 *
 *   - CARD + IRIS (recommended default): a card scan must succeed first;
 *     only then is the iris verified and attendance recorded.
 *   - CARD only: records on a successful card scan.
 *   - IRIS only: records on a successful iris verification.
 *
 * Session setup (from the timetable or a manual subject/class/room pick) and a
 * recorded-students table with manual correction are included.
 */
public final class AttendancePanel extends JPanel implements RefreshablePanel {

    private static final DateTimeFormatter TIME = DateTimeFormatter.ofPattern("hh:mm a");
    private static final String MODE_COMBO = "CARD + IRIS (recommended)";
    private static final String MODE_CARD_ONLY = "CARD only";
    private static final String MODE_IRIS_ONLY = "IRIS only";

    private final AppContext context;

    // Session setup
    private final JComboBox<String> slotChooser = new JComboBox<>();
    private final JComboBox<String> subjectChooser = new JComboBox<>();
    private final JComboBox<String> classChooser = new JComboBox<>();
    private final JComboBox<String> roomChooser = new JComboBox<>();
    private final javax.swing.JButton startButton = UIUtils.button("Start Session", UIUtils.ButtonStyle.PRIMARY);
    private final javax.swing.JButton closeButton = UIUtils.button("Close Session", UIUtils.ButtonStyle.DANGER);
    private final JLabel sessionStatus = new JLabel("No active session");

    // Capture
    private final JComboBox<String> modeChooser = new JComboBox<>(new String[]{MODE_COMBO, MODE_CARD_ONLY, MODE_IRIS_ONLY});
    private final JTextField registrationField = new JTextField();
    private final JComboBox<String> rosterChooser = new JComboBox<>();
    private final javax.swing.JButton scanCardButton = UIUtils.button("Scan Card", UIUtils.ButtonStyle.PRIMARY);
    private final javax.swing.JButton irisButton = UIUtils.button("Verify Iris", UIUtils.ButtonStyle.SECONDARY);
    private final JLabel captureStatus = new JLabel("Start a session to begin");
    private final JTextArea transcript = new JTextArea();

    // Records
    private final JTable recordsTable = UIUtils.table(
            new Object[0][0], new String[]{"Reg", "Student", "Method", "Status", "At"});
    private final JComboBox<String> manualStudentChooser = new JComboBox<>();
    private final javax.swing.JButton manualMarkButton = UIUtils.button("Mark Present", UIUtils.ButtonStyle.SUCCESS);

    public AttendancePanel(AppContext context) {
        this.context = context;
        setLayout(new BorderLayout());
        setBackground(UITheme.BACKGROUND);
        setBorder(BorderFactory.createEmptyBorder(20, 24, 24, 24));
        build();
    }

    @Override
    public void onShown() {
        context.addCardResultListener(cardListener);
        context.addIrisResultListener(irisListener);
        refreshAll();
    }

    @Override
    public void onHidden() {
        context.removeCardResultListener(cardListener);
        context.removeIrisResultListener(irisListener);
    }

    // ------------------------------------------------------------------
    // Shared event channel (fed by the Device Simulator)
    // ------------------------------------------------------------------

    private Student pendingCardStudent;

    private final Consumer<AuthenticationResult> cardListener =
            result -> UIUtils.onEdt(() -> onCardResult(result));

    private final Consumer<AuthenticationResult> irisListener =
            result -> UIUtils.onEdt(() -> onIrisResult(result));

    private void onCardResult(AuthenticationResult result) {
        if (context.getActiveSession() == null) {
            appendLog("Card presented, but no attendance session is active.");
            setCaptureStatus("Start a session first", UIUtils.StatusType.WARNING);
            return;
        }
        if (result.isSuccessful()) {
            pendingCardStudent = result.getStudent();
            appendLog("CARD OK · " + describe(result.getStudent()));
            if (isCardOnlyMode()) {
                mark(modeToMethod());
            } else {
                setCaptureStatus("Card accepted — present iris to finish", UIUtils.StatusType.INFO);
            }
        } else {
            appendLog("CARD " + friendly(result.getStatus()) + " · " + result.getMessage());
            setCaptureStatus("Card " + friendly(result.getStatus()), UIUtils.StatusType.ERROR);
        }
    }

    private void onIrisResult(AuthenticationResult result) {
        if (context.getActiveSession() == null) {
            appendLog("Iris scan, but no attendance session is active.");
            setCaptureStatus("Start a session first", UIUtils.StatusType.WARNING);
            return;
        }
        if (isIrisOnlyMode()) {
            if (result.isSuccessful()) {
                pendingCardStudent = result.getStudent();
                mark(modeToMethod());
            } else {
                appendLog("IRIS " + friendly(result.getStatus()) + " · " + result.getMessage());
                setCaptureStatus("Iris verification " + friendly(result.getStatus()), UIUtils.StatusType.ERROR);
                pendingCardStudent = null;
            }
            return;
        }

        // CARD + IRIS: iris is accepted only after a successful card scan.
        if (!result.isSuccessful()) {
            appendLog("IRIS " + friendly(result.getStatus()) + " · " + result.getMessage());
            setCaptureStatus("Iris verification " + friendly(result.getStatus()), UIUtils.StatusType.ERROR);
            return;
        }
        if (pendingCardStudent == null) {
            appendLog("IRIS OK but no card scan was accepted first.");
            setCaptureStatus("Card is required before iris", UIUtils.StatusType.WARNING);
            return;
        }
        Student irisStudent = result.getStudent();
        if (irisStudent != null && !irisStudent.getRegistrationNumber().equals(pendingCardStudent.getRegistrationNumber())) {
            appendLog("IRIS OK but belongs to a different student.");
            setCaptureStatus("Iris belongs to another student", UIUtils.StatusType.ERROR);
            return;
        }
        setCaptureStatus("Iris verified — recording attendance", UIUtils.StatusType.SUCCESS);
        mark(modeToMethod());
    }

    private void mark(String method) {
        AttendanceSession session = context.getActiveSession();
        Student student = pendingCardStudent;
        if (session == null || student == null) {
            return;
        }
        try {
            AttendanceRecord record = context.markAttendance(student, session, method);
            appendLog("RECORD OK · " + student.getRegistrationNumber() + " · " + AppContext.methodDisplayName(record));
            setCaptureStatus("Attendance recorded for " + student.getName(), UIUtils.StatusType.SUCCESS);
        } catch (Exception e) {
            setCaptureStatus("Not recorded · " + cleanError(e), UIUtils.StatusType.ERROR);
        } finally {
            pendingCardStudent = null;
            refreshRecords();
        }
    }

    private boolean isCardOnlyMode() {
        return MODE_CARD_ONLY.equals(modeChooser.getSelectedItem());
    }

    private boolean isIrisOnlyMode() {
        return MODE_IRIS_ONLY.equals(modeChooser.getSelectedItem());
    }

    private String modeToMethod() {
        if (isCardOnlyMode()) {
            return "CARD";
        }
        if (isIrisOnlyMode()) {
            return "IRIS";
        }
        return "CARD_AND_IRIS";
    }

    private static String friendly(AuthenticationResult.Status status) {
        switch (status) {
            case SUCCESS: return "accepted";
            case UNKNOWN_USER: return "unknown user";
            case INVALID_CARD: return "invalid card";
            case BIOMETRIC_MISMATCH: return "mismatch";
            case DEVICE_ERROR: return "device error";
            default: return "failed";
        }
    }

    private static String cleanError(Throwable e) {
        Throwable root = e;
        while (root.getCause() != null) {
            root = root.getCause();
        }
        String msg = root.getMessage();
        if (msg == null || msg.isBlank()) {
            return "could not be saved";
        }
        return msg;
    }

    private String describe(Student student) {
        if (student == null) {
            return "unknown student";
        }
        return student.getRegistrationNumber() + " — " + student.getName();
    }

    // ------------------------------------------------------------------
    // Layout
    // ------------------------------------------------------------------

    private void build() {
        registerActions();
        add(buildHeader(), BorderLayout.NORTH);

        JPanel columns = new JPanel(new GridLayout(0, 3, 14, 0));
        columns.setOpaque(false);
        columns.add(buildSessionCard());
        columns.add(buildCaptureCard());
        columns.add(buildRecordsCard());
        add(columns, BorderLayout.CENTER);
    }

    private Component buildHeader() {
        JPanel header = new JPanel();
        header.setLayout(new BoxLayout(header, BoxLayout.Y_AXIS));
        header.setOpaque(false);
        header.setBorder(BorderFactory.createEmptyBorder(0, 4, 18, 4));
        JLabel title = UIUtils.pageTitle("Attendance");
        JLabel subtitle = new JLabel("Capture student attendance via biometric readers, or mark manually.");
        subtitle.setFont(UITheme.bodyFont());
        subtitle.setForeground(UITheme.TEXT_SECONDARY);
        header.add(title);
        header.add(Box.createVerticalStrut(2));
        header.add(subtitle);
        return header;
    }

    private Component buildSessionCard() {
        JPanel card = cardSurface();
        card.add(UIUtils.sectionTitle("Session"));
        card.add(Box.createVerticalStrut(4));
        card.add(smallText("Start a session for a class, then capture students."));
        card.add(Box.createVerticalStrut(14));

        card.add(fieldLabel("Slot (today's timetable)"));
        fullWidth(card, slotChooser);
        card.add(Box.createVerticalStrut(10));

        card.add(fieldLabel("Subject"));
        fullWidth(card, subjectChooser);
        card.add(Box.createVerticalStrut(10));

        card.add(fieldLabel("Class"));
        fullWidth(card, classChooser);
        card.add(Box.createVerticalStrut(10));

        card.add(fieldLabel("Room"));
        fullWidth(card, roomChooser);
        card.add(Box.createVerticalStrut(16));

        startButton.setAlignmentX(Component.LEFT_ALIGNMENT);
        card.add(startButton);
        card.add(Box.createVerticalStrut(6));
        closeButton.setAlignmentX(Component.LEFT_ALIGNMENT);
        card.add(closeButton);

        card.add(Box.createVerticalStrut(16));
        sessionStatus.setFont(UITheme.font(Font.BOLD, UITheme.FONT_SECONDARY));
        sessionStatus.setForeground(UITheme.TEXT_SECONDARY);
        sessionStatus.setAlignmentX(Component.LEFT_ALIGNMENT);
        card.add(sessionStatus);
        return card;
    }

    private JPanel cardSurface() {
        JPanel card = new JPanel();
        card.setLayout(new BoxLayout(card, BoxLayout.Y_AXIS));
        card.setBackground(UITheme.SURFACE);
        card.setBorder(BorderFactory.createCompoundBorder(
                BorderFactory.createLineBorder(UITheme.BORDER),
                BorderFactory.createEmptyBorder(16, 18, 16, 18)));
        return card;
    }

    private void fullWidth(JPanel card, JComponent component) {
        component.setMaximumSize(new Dimension(Integer.MAX_VALUE, component.getPreferredSize().height));
        component.setAlignmentX(Component.LEFT_ALIGNMENT);
        card.add(component);
    }

    private Component buildCaptureCard() {
        JPanel card = cardSurface();
        card.add(UIUtils.sectionTitle("Biometric Capture"));
        card.add(Box.createVerticalStrut(4));
        card.add(smallText("Each step must follow the selected mode."));
        card.add(Box.createVerticalStrut(14));

        card.add(fieldLabel("Authentication mode"));
        fullWidth(card, modeChooser);
        card.add(Box.createVerticalStrut(14));

        JPanel stage = new JPanel(new GridLayout(1, 3, 6, 0));
        stage.setOpaque(false);
        stage.add(stageBadge("1 · CARD", "scan"));
        stage.add(stageBadge("2 · IRIS", "verify"));
        stage.add(stageBadge("3 · RECORD", "save"));
        card.add(stage);
        card.add(Box.createVerticalStrut(14));

        card.add(fieldLabel("Student (registration number)"));
        JPanel regRow = new JPanel(new BorderLayout(6, 0));
        regRow.setOpaque(false);
        regRow.add(registrationField, BorderLayout.CENTER);
        regRow.add(rosterChooser, BorderLayout.EAST);
        fullWidth(card, regRow);
        card.add(Box.createVerticalStrut(10));

        JPanel buttons = new JPanel(new GridLayout(1, 2, 8, 0));
        buttons.setOpaque(false);
        buttons.add(scanCardButton);
        buttons.add(irisButton);
        card.add(buttons);
        card.add(Box.createVerticalStrut(14));

        setCaptureStatus("Start a session to begin", UIUtils.StatusType.NEUTRAL);
        captureStatus.setFont(UITheme.secondaryFont());
        captureStatus.setAlignmentX(Component.LEFT_ALIGNMENT);
        card.add(captureStatus);
        card.add(Box.createVerticalStrut(10));

        transcript.setEditable(false);
        transcript.setLineWrap(true);
        transcript.setWrapStyleWord(true);
        transcript.setFont(UITheme.smallFont());
        transcript.setForeground(UITheme.TEXT_SECONDARY);
        transcript.setBackground(UITheme.SURFACE_MUTED);
        transcript.setBorder(BorderFactory.createCompoundBorder(
                BorderFactory.createLineBorder(UITheme.BORDER),
                BorderFactory.createEmptyBorder(8, 10, 8, 10)));
        JScrollPane scroll = new JScrollPane(transcript);
        scroll.setBorder(null);
        scroll.getViewport().setBackground(UITheme.SURFACE_MUTED);
        card.add(scroll);
        return card;
    }

    private Component buildRecordsCard() {
        JPanel card = new JPanel(new BorderLayout(0, 10));
        card.setBackground(UITheme.SURFACE);
        card.setBorder(BorderFactory.createCompoundBorder(
                BorderFactory.createLineBorder(UITheme.BORDER),
                BorderFactory.createEmptyBorder(16, 18, 16, 18)));

        JPanel top = new JPanel(new BorderLayout());
        top.setOpaque(false);
        top.add(UIUtils.sectionTitle("Recorded"), BorderLayout.WEST);
        card.add(top, BorderLayout.NORTH);
        card.add(UIUtils.scroll(recordsTable), BorderLayout.CENTER);

        JPanel manual = new JPanel(new BorderLayout(8, 0));
        manual.setOpaque(false);
        manual.add(manualStudentChooser, BorderLayout.CENTER);
        manual.add(manualMarkButton, BorderLayout.EAST);
        card.add(manual, BorderLayout.SOUTH);
        return card;
    }

    private Component stageBadge(String title, String caption) {
        JPanel panel = new JPanel();
        panel.setLayout(new BoxLayout(panel, BoxLayout.Y_AXIS));
        panel.setBackground(UITheme.SURFACE_MUTED);
        panel.setBorder(BorderFactory.createCompoundBorder(
                BorderFactory.createLineBorder(UITheme.BORDER),
                BorderFactory.createEmptyBorder(10, 8, 10, 8)));
        JLabel t = new JLabel(title);
        t.setFont(UITheme.font(Font.BOLD, 12));
        t.setForeground(UITheme.TEXT);
        t.setAlignmentX(Component.CENTER_ALIGNMENT);
        JLabel c = new JLabel(caption);
        c.setFont(UITheme.smallFont());
        c.setForeground(UITheme.TEXT_MUTED);
        c.setAlignmentX(Component.CENTER_ALIGNMENT);
        panel.add(t);
        panel.add(c);
        return panel;
    }

    private static JLabel fieldLabel(String text) {
        JLabel l = new JLabel(text);
        l.setFont(UITheme.secondaryFont());
        l.setForeground(UITheme.TEXT_SECONDARY);
        l.setAlignmentX(Component.LEFT_ALIGNMENT);
        return l;
    }

    private static JLabel smallText(String text) {
        JLabel l = new JLabel(text);
        l.setFont(UITheme.secondaryFont());
        l.setForeground(UITheme.TEXT_MUTED);
        l.setAlignmentX(Component.LEFT_ALIGNMENT);
        return l;
    }

    private void setCaptureStatus(String text, UIUtils.StatusType type) {
        captureStatus.setForeground(StatusColor.of(type));
        captureStatus.setText(text);
    }

    private static final class StatusColor {
        static Color of(UIUtils.StatusType type) {
            switch (type) {
                case SUCCESS: return UITheme.SUCCESS;
                case ERROR: return UITheme.ERROR;
                case WARNING: return UITheme.WARNING;
                default: return UITheme.INFO;
            }
        }
    }

    private void appendLog(String line) {
        transcript.append(java.time.LocalTime.now().format(TIME) + "  " + line + "\n");
    }

    // ------------------------------------------------------------------
    // Data wiring
    // ------------------------------------------------------------------

    private void registerActions() {
        startButton.addActionListener(this::onStartSession);
        closeButton.addActionListener(e -> {
            if (context.getActiveSession() == null) {
                return;
            }
            context.closeActiveSession(context.getCurrentFaculty().getFacultyId());
            refreshAll();
        });
        scanCardButton.addActionListener(e -> onScanCard());
        irisButton.addActionListener(e -> onScanIris());
        manualMarkButton.addActionListener(e -> onManualMark());
        registrationField.addActionListener(e -> onScanCard());
        rosterChooser.addActionListener(e -> {
            Object sel = rosterChooser.getSelectedItem();
            if (sel != null) {
                String reg = sel.toString().split(" — ")[0].trim();
                registrationField.setText(reg);
            }
        });
    }

    private void onStartSession(ActionEvent e) {
        TicketChoice choice = currentChoice();
        if (choice == null) {
            UIUtils.showError(this, "Nothing to start", "Choose a focus and a slot (or a subject / class / room) first.");
            return;
        }
        if (!choice.complete) {
            UIUtils.showError(this, "Incomplete selection", "Please pick a slot, or choose a subject, class and room.");
            return;
        }
        AttendanceSession session;
        if (choice.fromSlot) {
            session = context.openAttendanceForSlot(choice.slot, context.getCurrentFaculty().getFacultyId());
        } else {
            session = context.startManualSession(choice.subjectId, choice.classId, choice.roomId,
                    context.getCurrentFaculty().getFacultyId());
        }
        if (session == null) {
            UIUtils.showError(this, "Could not start session",
                    "The session could not be opened. Check that the window is valid and try again.");
            return;
        }
        refreshAll();
    }

    private void onScanCard() {
        if (context.getActiveSession() == null) {
            UIUtils.showError(this, "No session", "Start an attendance session before scanning cards.");
            return;
        }
        context.simulateCardScan(registrationField.getText().trim());
    }

    private void onScanIris() {
        if (context.getActiveSession() == null) {
            UIUtils.showError(this, "No session", "Start an attendance session before verifying iris scans.");
            return;
        }
        if (!isIrisOnlyMode() && pendingCardStudent == null) {
            setCaptureStatus("Scan the student's card first", UIUtils.StatusType.WARNING);
            return;
        }
        context.simulateIrisApproved(registrationField.getText().trim());
    }

    private void onManualMark() {
        if (context.getActiveSession() == null) {
            UIUtils.showError(this, "No session", "Start an attendance session before marking students.");
            return;
        }
        Object sel = manualStudentChooser.getSelectedItem();
        if (sel == null) {
            return;
        }
        String reg = sel.toString().split(" — ")[0].trim();
        Student student = context.students().findById(reg);
        if (student == null) {
            return;
        }
        pendingCardStudent = student;
        mark("MANUAL");
        refreshRoster();
    }

    private void refreshAll() {
        refreshChoosers();
        refreshSessionStatus();
        refreshRoster();
        refreshRecords();
    }

    private void refreshChoosers() {
        String saved = (String) slotChooser.getSelectedItem();
        slotChooser.removeAllItems();
        List<TimetableSlot> slots = context.slotsForFacultyDay(
                context.getCurrentFaculty().getFacultyId(), java.time.LocalDate.now().getDayOfWeek());
        for (TimetableSlot slot : slots) {
            slotChooser.addItem(context.subjectName(slot.getSubjectId())
                    + " · " + context.className(slot.getClassId())
                    + " · Room " + context.roomNumber(slot.getClassroomId())
                    + " · " + slot.getStartTime().format(TIME));
        }
        if (saved != null && slotChooser.getItemCount() > 0) {
            slotChooser.setSelectedItem(saved);
        }

        List<Subject> subjects = context.subjects().findAll();
        subjectChooser.removeAllItems();
        for (Subject s : subjects) {
            subjectChooser.addItem(s.getSubjectName() + " (" + s.getSubjectCode() + ")");
        }
        List<ClassSection> classes = context.classSections().findAll();
        classChooser.removeAllItems();
        for (ClassSection c : classes) {
            classChooser.addItem(c.getClassName());
        }
        List<Classroom> rooms = context.classrooms().findAll();
        roomChooser.removeAllItems();
        for (Classroom room : rooms) {
            roomChooser.addItem("Room " + room.getRoomNumber());
        }
    }

    private void refreshSessionStatus() {
        AttendanceSession session = context.getActiveSession();
        if (session == null) {
            sessionStatus.setForeground(UITheme.TEXT_SECONDARY);
            sessionStatus.setText("No active session");
            return;
        }
        String text = "Active: " + context.subjectName(session.getSubjectId())
                + " · " + context.className(session.getClassId())
                + " · Room " + context.roomNumber(session.getClassroomId())
                + "  (" + Time.format(session.getStartTime()) + ")";
        sessionStatus.setForeground(UITheme.SUCCESS);
        sessionStatus.setText(text);
    }

    private void refreshRoster() {
        AttendanceSession session = context.getActiveSession();
        rosterChooser.removeAllItems();
        manualStudentChooser.removeAllItems();
        if (session == null) {
            return;
        }
        List<Student> students = context.studentsForClass(session.getClassId());
        for (Student s : students) {
            String item = s.getRegistrationNumber() + " — " + s.getName();
            rosterChooser.addItem(item);
            manualStudentChooser.addItem(item);
        }
    }

    private void refreshRecords() {
        AttendanceSession session = context.getActiveSession();
        List<Object[]> rows = new ArrayList<>();
        if (session != null) {
            for (AttendanceRecord record : context.sessionRecords(session.getSessionId())) {
                rows.add(new Object[]{
                        record.getStudentId(),
                        context.studentName(record.getStudentId()),
                        AppContext.methodDisplayName(record),
                        record.getStatus() == null ? "—" : record.getStatus().name(),
                        Time.format(record.getTimestamp())
                });
            }
        }
        recordsTable.setModel(new javax.swing.table.DefaultTableModel(
                rows.toArray(new Object[0][]),
                new String[]{"Reg", "Student", "Method", "Status", "At"}) {
            @Override
            public boolean isCellEditable(int row, int column) {
                return false;
            }
        });
        UIUtils.configureTable(recordsTable);
    }

    private TicketChoice currentChoice() {
        TimetableSlot slot = selectedSlot();
        if (slot != null) {
            return new TicketChoice(true, slot, null, null, null, true);
        }
        String subjectId = subjectIdFromChooser();
        String classId = classIdFromChooser();
        String roomId = roomIdFromChooser();
        boolean complete = subjectId != null && classId != null && roomId != null;
        return new TicketChoice(false, null, subjectId, classId, roomId, complete);
    }

    private TimetableSlot selectedSlot() {
        List<TimetableSlot> slots = context.slotsForFacultyDay(
                context.getCurrentFaculty().getFacultyId(), java.time.LocalDate.now().getDayOfWeek());
        int idx = slotChooser.getSelectedIndex();
        if (idx >= 0 && idx < slots.size()) {
            return slots.get(idx);
        }
        return null;
    }

    private String subjectIdFromChooser() {
        int idx = subjectChooser.getSelectedIndex();
        List<Subject> subjects = context.subjects().findAll();
        if (idx >= 0 && idx < subjects.size()) {
            return subjects.get(idx).getSubjectId();
        }
        return null;
    }

    private String classIdFromChooser() {
        int idx = classChooser.getSelectedIndex();
        List<ClassSection> classes = context.classSections().findAll();
        if (idx >= 0 && idx < classes.size()) {
            return classes.get(idx).getClassId();
        }
        return null;
    }

    private String roomIdFromChooser() {
        int idx = roomChooser.getSelectedIndex();
        List<Classroom> rooms = context.classrooms().findAll();
        if (idx >= 0 && idx < rooms.size()) {
            return rooms.get(idx).getClassroomId();
        }
        return null;
    }

    private static final class TicketChoice {
        final boolean fromSlot;
        final TimetableSlot slot;
        final String subjectId;
        final String classId;
        final String roomId;
        final boolean complete;

        TicketChoice(boolean fromSlot, TimetableSlot slot, String subjectId,
                     String classId, String roomId, boolean complete) {
            this.fromSlot = fromSlot;
            this.slot = slot;
            this.subjectId = subjectId;
            this.classId = classId;
            this.roomId = roomId;
            this.complete = complete;
        }
    }

    private static final class Time {
        static String format(java.time.LocalDateTime dateTime) {
            if (dateTime == null) {
                return "—";
            }
            return dateTime.format(TIME);
        }
    }
}
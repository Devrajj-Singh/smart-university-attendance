package com.smartattendance.ui;

import com.smartattendance.model.AttendanceRecord;
import com.smartattendance.model.AttendanceSession;
import com.smartattendance.model.TimetableSlot;

import javax.swing.BorderFactory;
import javax.swing.Box;
import javax.swing.BoxLayout;
import javax.swing.JComboBox;
import javax.swing.JLabel;
import javax.swing.JPanel;
import javax.swing.JScrollPane;
import javax.swing.JTable;
import java.awt.BorderLayout;
import java.awt.Component;
import java.awt.GridLayout;
import java.io.File;
import java.io.FileWriter;
import java.io.PrintWriter;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Reporting screen: aggregate stats for the faculty's sessions, a per-session
 * breakdown of present / late / absent, the underlying records table, and an
 * export-to-CSV action.
 */
public final class ReportsPanel extends JPanel implements RefreshablePanel {

    private static final DateTimeFormatter TIME = DateTimeFormatter.ofPattern("hh:mm a");
    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("EEE, MMM d");

    private final AppContext context;

    private final com.smartattendance.ui.components.StatCard sessionsCard =
            new com.smartattendance.ui.components.StatCard("▤", "Sessions today");
    private final com.smartattendance.ui.components.StatCard markedCard =
            new com.smartattendance.ui.components.StatCard("◷", "Records (selected)");
    private final com.smartattendance.ui.components.StatCard presentCard =
            new com.smartattendance.ui.components.StatCard("✓", "Present");
    private final com.smartattendance.ui.components.StatCard lateCard =
            new com.smartattendance.ui.components.StatCard("⚠", "Late");

    private final JComboBox<String> sessionChooser = new JComboBox<>();
    private final javax.swing.JButton refreshButton = UIUtils.button("Refresh", UIUtils.ButtonStyle.SECONDARY);
    private final javax.swing.JButton exportButton = UIUtils.button("Export CSV", UIUtils.ButtonStyle.GHOST);
    private final JTable recordsTable = UIUtils.table(
            new Object[0][0], new String[]{"Reg", "Student", "Method", "Status", "At"});

    public ReportsPanel(AppContext context) {
        this.context = context;
        sessionsCard.setAccent(new java.awt.Color(0x4f, 0x8a, 0xe0));
        markedCard.setAccent(new java.awt.Color(0x1B, 0x7A, 0x44));
        presentCard.setAccent(new java.awt.Color(0x2F, 0x6F, 0xED));
        lateCard.setAccent(new java.awt.Color(0x9A, 0x66, 0x00));
        setLayout(new BorderLayout());
        setBackground(UITheme.BACKGROUND);
        setBorder(BorderFactory.createEmptyBorder(20, 24, 24, 24));
        build();
    }

    @Override
    public void onShown() {
        refresh();
    }

    private void build() {
        buildActions();
        add(buildHeader(), BorderLayout.NORTH);
        add(buildBody(), BorderLayout.CENTER);
    }

    private Component buildHeader() {
        JPanel header = new JPanel();
        header.setLayout(new BoxLayout(header, BoxLayout.Y_AXIS));
        header.setOpaque(false);
        header.setBorder(BorderFactory.createEmptyBorder(0, 4, 18, 4));
        header.add(UIUtils.pageTitle("Reports"));
        JLabel sub = new JLabel("Session summaries and attendance records for your classes.");
        sub.setFont(UITheme.bodyFont());
        sub.setForeground(UITheme.TEXT_SECONDARY);
        header.add(Box.createVerticalStrut(2));
        header.add(sub);
        return header;
    }

    private Component buildBody() {
        JPanel body = new JPanel(new BorderLayout(0, 16));
        body.setOpaque(false);

        JPanel stats = new JPanel(new GridLayout(0, 4, 14, 0));
        stats.setOpaque(false);
        stats.add(sessionsCard);
        stats.add(markedCard);
        stats.add(presentCard);
        stats.add(lateCard);
        body.add(stats, BorderLayout.NORTH);

        JPanel row = new JPanel(new BorderLayout(16, 0));
        row.setOpaque(false);
        row.add(buildSummaryCard(), BorderLayout.WEST);
        row.add(buildRecordsCard(), BorderLayout.CENTER);
        body.add(row, BorderLayout.CENTER);
        return body;
    }

    private Component buildSummaryCard() {
        JPanel card = new JPanel(new BorderLayout(0, 12));
        card.setBackground(UITheme.SURFACE);
        card.setBorder(BorderFactory.createCompoundBorder(
                BorderFactory.createLineBorder(UITheme.BORDER),
                BorderFactory.createEmptyBorder(16, 18, 16, 18)));
        card.setPreferredSize(new java.awt.Dimension(380, 0));

        JPanel top = new JPanel(new BorderLayout());
        top.setOpaque(false);
        top.add(UIUtils.sectionTitle("Session Summary"), BorderLayout.WEST);
        top.add(refreshButton, BorderLayout.EAST);
        card.add(top, BorderLayout.NORTH);

        JPanel controls = new JPanel(new BorderLayout(8, 0));
        controls.setOpaque(false);
        controls.add(sessionChooser, BorderLayout.CENTER);
        card.add(controls, BorderLayout.CENTER);

        JPanel legend = new JPanel(new GridLayout(0, 1, 0, 8));
        legend.setOpaque(false);
        legend.add(legendRow("Present", UIUtils.badge("·", UIUtils.StatusType.SUCCESS)));
        legend.add(legendRow("Late", UIUtils.badge("·", UIUtils.StatusType.WARNING)));
        legend.add(legendRow("Absent / not marked", UIUtils.badge("·", UIUtils.StatusType.ERROR)));
        card.add(legend, BorderLayout.SOUTH);
        return card;
    }

    private Component legendRow(String label, Component badge) {
        JPanel row = new JPanel(new BorderLayout(10, 0));
        row.setOpaque(false);
        JLabel l = new JLabel(label);
        l.setFont(UITheme.secondaryFont());
        l.setForeground(UITheme.TEXT_SECONDARY);
        row.add(l, BorderLayout.CENTER);
        row.add(badge, BorderLayout.EAST);
        return row;
    }

    private Component buildRecordsCard() {
        JPanel card = new JPanel(new BorderLayout(0, 10));
        card.setBackground(UITheme.SURFACE);
        card.setBorder(BorderFactory.createCompoundBorder(
                BorderFactory.createLineBorder(UITheme.BORDER),
                BorderFactory.createEmptyBorder(16, 18, 16, 18)));

        JPanel top = new JPanel(new BorderLayout());
        top.setOpaque(false);
        top.add(UIUtils.sectionTitle("Records"), BorderLayout.WEST);
        top.add(exportButton, BorderLayout.EAST);
        card.add(top, BorderLayout.NORTH);
        card.add(UIUtils.scroll(recordsTable), BorderLayout.CENTER);
        return card;
    }

    private void buildActions() {
        refreshButton.addActionListener(e -> updateSummary());
        exportButton.addActionListener(e -> exportCsv());
        sessionChooser.addActionListener(e -> updateSummary());
    }

    // ------------------------------------------------------------------
    // Data
    // ------------------------------------------------------------------

    public void refresh() {
        refreshSessionChooser();
        updateStats();
        updateSummary();
    }

    private List<AttendanceSession> todaySessions() {
        if (context.getCurrentFaculty() == null) {
            return new ArrayList<>();
        }
        return context.todaySessionsForFaculty(context.getCurrentFaculty().getFacultyId());
    }

    private void refreshSessionChooser() {
        List<AttendanceSession> sessions = todaySessions();
        String saved = (String) sessionChooser.getSelectedItem();
        sessionChooser.removeAllItems();
        for (AttendanceSession session : sessions) {
            sessionChooser.addItem(context.subjectName(session.getSubjectId()) + " · "
                    + context.className(session.getClassId()) + " · Room "
                    + context.roomNumber(session.getClassroomId()) + " · "
                    + DATE.format(session.getStartTime()));
        }
        if (sessions.isEmpty()) {
            sessionsCard.setValue("0");
        } else {
            sessionsCard.setValue(String.valueOf(sessions.size()));
        }
        if (saved != null && sessionChooser.getItemCount() > 0) {
            sessionChooser.setSelectedItem(saved);
        }
    }

    private void updateStats() {
        AttendanceSession session = selectedSession();
        if (session == null) {
            markedCard.setValue("—");
            presentCard.setValue("—");
            lateCard.setValue("—");
            recordsTable.setModel(emptyModel());
            return;
        }
        List<AttendanceRecord> records = context.sessionRecords(session.getSessionId());
        Map<String, Object> summary = context.attendanceSummary(session.getSessionId());
        markedCard.setValue(String.valueOf(records.size()));
        presentCard.setValue(String.valueOf(summary.getOrDefault("present", 0)));
        lateCard.setValue(String.valueOf(summary.getOrDefault("late", 0)));
        refreshRecordsTable(records);
    }

    private void updateSummary() {
        updateStats();
    }

    private AttendanceSession selectedSession() {
        List<AttendanceSession> sessions = todaySessions();
        int idx = sessionChooser.getSelectedIndex();
        if (idx >= 0 && idx < sessions.size()) {
            return sessions.get(idx);
        }
        return null;
    }

    private void refreshRecordsTable(List<AttendanceRecord> records) {
        List<Object[]> rows = new ArrayList<>();
        for (AttendanceRecord record : records) {
            rows.add(new Object[]{
                    record.getStudentId(),
                    context.studentName(record.getStudentId()),
                    AppContext.methodDisplayName(record),
                    record.getStatus() == null ? "—" : record.getStatus().name(),
                    record.getTimestamp() == null ? "—" : record.getTimestamp().format(TIME)
            });
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

    private javax.swing.table.TableModel emptyModel() {
        return new javax.swing.table.DefaultTableModel(
                new Object[0][0],
                new String[]{"Reg", "Student", "Method", "Status", "At"}) {
            @Override
            public boolean isCellEditable(int row, int column) {
                return false;
            }
        };
    }

    private void exportCsv() {
        AttendanceSession session = selectedSession();
        if (session == null) {
            UIUtils.showError(this, "Nothing to export", "Select a session first.");
            return;
        }
        List<AttendanceRecord> records = context.sessionRecords(session.getSessionId());
        if (records.isEmpty()) {
            UIUtils.showError(this, "Nothing to export", "Selected session has no records.");
            return;
        }
        File dir = new File("exports");
        if (!dir.exists()) {
            dir.mkdirs();
        }
        File file = new File(dir, "attendance-" + safeFile(session.getSessionId())
                + "-" + java.time.LocalDate.now().toString() + ".csv");
        try (PrintWriter writer = new PrintWriter(new FileWriter(file))) {
            writer.println("registration,student,method,status,timestamp");
            for (AttendanceRecord record : records) {
                writer.println(String.join(",",
                        record.getStudentId(),
                        "\"" + context.studentName(record.getStudentId()) + "\"",
                        AppContext.methodDisplayName(record),
                        record.getStatus() == null ? "" : record.getStatus().name(),
                        record.getTimestamp() == null ? "" : record.getTimestamp().toString()));
            }
            UIUtils.showSuccess(this, "Exported " + records.size() + " records to:\n" + file.getAbsolutePath());
        } catch (Exception e) {
            UIUtils.showUnexpectedError(this, e);
        }
    }

    private static String safeFile(String id) {
        return id.replaceAll("[^a-zA-Z0-9_-]", "");
    }
}
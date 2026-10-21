package com.smartattendance.ui;

import com.smartattendance.model.AttendanceSession;
import com.smartattendance.model.TimetableSlot;
import com.smartattendance.ui.components.Sidebar;
import com.smartattendance.ui.components.StatCard;
import com.smartattendance.ui.components.StyledCardPanel;

import javax.swing.BorderFactory;
import javax.swing.Box;
import javax.swing.BoxLayout;
import javax.swing.JLabel;
import javax.swing.JPanel;
import javax.swing.JScrollPane;
import java.awt.BorderLayout;
import java.awt.Component;
import java.awt.FlowLayout;
import java.awt.Font;
import java.awt.GridBagConstraints;
import java.awt.GridBagLayout;
import java.awt.GridLayout;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Landing page: greeting, headline stats, quick actions and today's
 * schedule for the signed-in faculty.
 */
public final class DashboardPanel extends JPanel implements RefreshablePanel {

    private static final DateTimeFormatter TIME = DateTimeFormatter.ofPattern("hh:mm a");

    private final AppContext context;
    private final MainFrame main;
    private final StatCard todayCount = new StatCard("·", "Classes today");
    private final StatCard activeCard = new StatCard("○", "Active session");
    private final StatCard recordedCard = new StatCard("◷", "Attendance marked");
    private final StatCard pendingCard = new StatCard("↻", "Offline outbox");
    private final JLabel greetingName = new JLabel("");
    private final JPanel schedulePanel = new JPanel();

    public DashboardPanel(AppContext context, MainFrame main) {
        this.context = context;
        this.main = main;
        todayCount.setAccent(new java.awt.Color(0x4f, 0x8a, 0xe0));
        activeCard.setAccent(new java.awt.Color(0x1B, 0x7A, 0x44));
        recordedCard.setAccent(new java.awt.Color(0x2F, 0x6F, 0xED));
        pendingCard.setAccent(new java.awt.Color(0x9A, 0x66, 0x00));
        setLayout(new BorderLayout());
        setBackground(UITheme.BACKGROUND);
        setBorder(BorderFactory.createEmptyBorder(20, 24, 24, 24));
        rebuild();
    }

    private void rebuild() {
        removeAll();
        add(buildHeader(), BorderLayout.NORTH);
        add(buildBody(), BorderLayout.CENTER);
        revalidate();
        repaint();
    }

    @Override
    public void onShown() {
        refresh();
    }

    private void refresh() {
        UIUtils.runAsync(() -> computeMetrics(),
                m -> {
                    todayCount.setValue(String.valueOf(m[0]));
                    activeCard.setValue((String) m[1]);

                    @SuppressWarnings("unchecked")
                    List<AttendanceSession> s = (List<AttendanceSession>) m[2];
                    recordedCard.setValue(String.valueOf(countRecords(s)));

                    long pending = context.pendingSyncCount();
                    pendingCard.setValue(String.valueOf(pending));
                    pendingCard.setAccent(pending > 0 ? new java.awt.Color(0x9A, 0x66, 0x00)
                            : new java.awt.Color(0x1B, 0x7A, 0x44));
                    renderSchedule(s);
                    context.notifyUiStateChanged();
                },
                e -> context.notifyUiStateChanged());
    }

    private Object[] computeMetrics() {
        LocalDate today = LocalDate.now();
        java.time.DayOfWeek day = today.getDayOfWeek();
        String up = day.name().substring(0, 1) + day.name().substring(1).toLowerCase();
        List<TimetableSlot> slots = context.slotsForFacultyDay(context.getCurrentFaculty().getFacultyId(), day);
        AttendanceSession active = context.getActiveSession();
        List<AttendanceSession> todaySessions = context.todaySessionsForFaculty(context.getCurrentFaculty().getFacultyId());
        return new Object[]{slots.size(),
                active != null && active.getStatus().name().equals("ACTIVE") ? "Open" : "—",
                todaySessions};
    }

    private long countRecords(List<AttendanceSession> sessions) {
        long total = 0;
        for (AttendanceSession s : sessions) {
            total += context.sessionRecords(s.getSessionId()).size();
        }
        return total;
    }

    private Component buildHeader() {
        JPanel header = new JPanel();
        header.setLayout(new BoxLayout(header, BoxLayout.Y_AXIS));
        header.setOpaque(false);
        header.setBorder(BorderFactory.createEmptyBorder(0, 0, 18, 0));

        JLabel dateLabel = new JLabel(java.time.LocalDate.now().format(
                DateTimeFormatter.ofPattern("EEEE, MMMM d, yyyy")));
        dateLabel.setFont(UITheme.smallFont());
        dateLabel.setForeground(UITheme.TEXT_MUTED);

        String name = context.getCurrentFaculty() != null
                ? context.getCurrentFaculty().getName() : "Faculty";
        greetingName.setText("Good day, " + splitFirstName(name));
        greetingName.setFont(UITheme.pageTitleFont());
        greetingName.setForeground(UITheme.TEXT);

        JLabel subtitle = new JLabel("Overview of today's teaching and attendance activity.");
        subtitle.setFont(UITheme.bodyFont());
        subtitle.setForeground(UITheme.TEXT_SECONDARY);

        header.add(dateLabel);
        header.add(Box.createVerticalStrut(4));
        header.add(greetingName);
        header.add(Box.createVerticalStrut(2));
        header.add(subtitle);
        return header;
    }

    private static String splitFirstName(String name) {
        if (name == null || name.isBlank()) {
            return "Faculty";
        }
        String[] parts = name.trim().split("\\s+");
        return parts[0];
    }

    private Component buildBody() {
        JPanel body = new JPanel(new BorderLayout(0, 18));
        body.setOpaque(false);

        JPanel stats = new JPanel(new GridLayout(0, 4, 14, 0));
        stats.setOpaque(false);
        stats.add(todayCount);
        stats.add(activeCard);
        stats.add(recordedCard);
        stats.add(pendingCard);
        body.add(stats, BorderLayout.NORTH);

        JPanel lower = new JPanel(new GridLayout(0, 2, 18, 0));
        lower.setOpaque(false);
        lower.add(buildScheduleCard());
        lower.add(buildQuickActions());
        body.add(lower, BorderLayout.CENTER);
        return body;
    }

    private Component buildScheduleCard() {
        StyledCardPanel card = UIUtils.cardPanel(0, 0);
        card.setBorder(BorderFactory.createEmptyBorder(0, 0, 0, 0));

        JPanel head = new JPanel(new BorderLayout());
        head.setOpaque(false);
        head.setBorder(BorderFactory.createEmptyBorder(16, 18, 10, 18));
        JLabel title = UIUtils.sectionTitle("Today's Schedule");
        title.setBorder(BorderFactory.createEmptyBorder(0, 2, 0, 0));
        head.add(title, BorderLayout.CENTER);
        JLabel badge = UIUtils.badge("LIVE", UIUtils.StatusType.INFO);
        JPanel wrap = new JPanel(new FlowLayout(FlowLayout.RIGHT, 0, 0));
        wrap.setOpaque(false);
        wrap.add(badge);
        head.add(wrap, BorderLayout.EAST);

        schedulePanel.setLayout(new BoxLayout(schedulePanel, BoxLayout.Y_AXIS));
        schedulePanel.setOpaque(false);
        JScrollPane scroller = new JScrollPane(schedulePanel);
        scroller.setBorder(null);
        scroller.getViewport().setBackground(UITheme.SURFACE);

        card.add(head, BorderLayout.NORTH);
        card.add(scroller, BorderLayout.CENTER);
        return card;
    }

    private void renderSchedule(List<AttendanceSession> sessions) {
        // filtered to the schedule slots for today, matched against recent sessions
        schedulePanel.removeAll();
        List<TimetableSlot> slots = context.slotsForFacultyDay(
                context.getCurrentFaculty().getFacultyId(),
                LocalDate.now().getDayOfWeek());

        if (slots.isEmpty()) {
            schedulePanel.add(new com.smartattendance.ui.components.EmptyState(
                    "No classes scheduled today", "Your timetable is empty for this day."));
        } else {
            for (TimetableSlot slot : slots) {
                schedulePanel.add(buildSlotRow(slot));
                schedulePanel.add(Box.createVerticalStrut(8));
            }
        }
        schedulePanel.revalidate();
        schedulePanel.repaint();
    }

    private Component buildSlotRow(TimetableSlot slot) {
        JPanel row = new JPanel(new BorderLayout(12, 0));
        row.setOpaque(false);
        row.setBorder(BorderFactory.createEmptyBorder(6, 18, 6, 18));
        row.setMaximumSize(new java.awt.Dimension(Integer.MAX_VALUE, 58));

        JPanel time = new JPanel(new GridBagLayout());
        time.setOpaque(false);
        GridBagConstraints g = new GridBagConstraints();
        g.gridx = 0;
        g.gridy = 0;
        JLabel timeLabel = new JLabel(slot.getStartTime().format(TIME) + " – " + slot.getEndTime().format(TIME));
        timeLabel.setFont(UITheme.font(Font.BOLD, 12));
        timeLabel.setForeground(UITheme.ACCENT);
        time.add(timeLabel, g);
        row.add(time, BorderLayout.WEST);

        JPanel info = new JPanel();
        info.setLayout(new BoxLayout(info, BoxLayout.Y_AXIS));
        info.setOpaque(false);
        JLabel subject = new JLabel(context.subjectName(slot.getSubjectId()));
        subject.setFont(UITheme.bodyStrongFont());
        subject.setForeground(UITheme.TEXT);
        JLabel where = new JLabel(context.className(slot.getClassId()) + " · Room " + context.roomNumber(slot.getClassroomId()));
        where.setFont(UITheme.secondaryFont());
        where.setForeground(UITheme.TEXT_SECONDARY);
        info.add(subject);
        info.add(where);
        row.add(info, BorderLayout.CENTER);

        boolean isNow = LocalTime.now().isAfter(slot.getStartTime())
                && LocalTime.now().isBefore(slot.getEndTime());
        row.add(UIUtils.badge(isNow ? "In progress" : "Scheduled", isNow ? UIUtils.StatusType.SUCCESS : UIUtils.StatusType.NEUTRAL),
                BorderLayout.EAST);
        return row;
    }

    private Component buildQuickActions() {
        StyledCardPanel card = UIUtils.cardPanel(0, 0);
        JPanel pad = new JPanel();
        pad.setLayout(new BoxLayout(pad, BoxLayout.Y_AXIS));
        pad.setOpaque(false);
        pad.setBorder(BorderFactory.createEmptyBorder(16, 18, 16, 18));

        JLabel title = UIUtils.sectionTitle("Quick Actions");
        title.setAlignmentX(Component.LEFT_ALIGNMENT);
        pad.add(title);
        pad.add(Box.createVerticalStrut(6));
        pad.add(UIUtils.secondary("Common tasks you perform every day."));
        pad.add(Box.createVerticalStrut(14));

        pad.add(actionRow("Open the attendance screen", "Take attendance for a live or manual session",
                "Open Attendance", () -> main.navigate(Sidebar.Page.ATTENDANCE)));
        pad.add(Box.createVerticalStrut(10));
        pad.add(actionRow("View the weekly timetable", "See today's and upcoming classes",
                "View Timetable", () -> main.navigate(Sidebar.Page.TIMETABLE)));
        pad.add(Box.createVerticalStrut(10));
        pad.add(actionRow("Generate reports", "Export session summaries and analytics",
                "Reports", () -> main.navigate(Sidebar.Page.REPORTS)));

        card.add(pad, BorderLayout.CENTER);
        return card;
    }

    private Component actionRow(String title, String caption, String buttonLabel, Runnable action) {
        JPanel row = new JPanel(new BorderLayout(12, 0));
        row.setOpaque(true);
        row.setBackground(UITheme.SURFACE_MUTED);
        row.setBorder(BorderFactory.createCompoundBorder(
                BorderFactory.createLineBorder(UITheme.BORDER),
                UIUtils.padding(10, 14, 10, 14)));
        row.setMaximumSize(new java.awt.Dimension(Integer.MAX_VALUE, 58));

        JPanel text = new JPanel();
        text.setLayout(new BoxLayout(text, BoxLayout.Y_AXIS));
        text.setOpaque(false);
        JLabel t = new JLabel(title);
        t.setFont(UITheme.bodyStrongFont());
        t.setForeground(UITheme.TEXT);
        JLabel c = new JLabel(caption);
        c.setFont(UITheme.secondaryFont());
        c.setForeground(UITheme.TEXT_MUTED);
        text.add(t);
        text.add(c);
        row.add(text, BorderLayout.CENTER);

        var btn = UIUtils.button(buttonLabel, UIUtils.ButtonStyle.PRIMARY);
        btn.setFont(UITheme.secondaryFont());
        btn.addActionListener(e -> action.run());
        row.add(btn, BorderLayout.EAST);
        return row;
    }
}
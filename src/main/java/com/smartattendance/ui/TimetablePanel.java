package com.smartattendance.ui;

import com.smartattendance.model.AttendanceSession;
import com.smartattendance.model.TimetableSlot;
import com.smartattendance.ui.components.Sidebar;

import javax.swing.BorderFactory;
import javax.swing.Box;
import javax.swing.BoxLayout;
import javax.swing.JLabel;
import javax.swing.JPanel;
import javax.swing.JScrollPane;
import java.awt.BorderLayout;
import java.awt.FlowLayout;
import java.awt.Font;
import java.awt.GridLayout;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Weekly timetable for the signed-in faculty, organized by day. Selecting a
 * day shows that day's classes; each class has an "Open Attendance" action.
 */
public final class TimetablePanel extends JPanel implements RefreshablePanel {

    private static final DateTimeFormatter TIME = DateTimeFormatter.ofPattern("hh:mm a");

    private final AppContext context;
    private final MainFrame main;
    private final JPanel dayCards = new JPanel();
    private DayOfWeek selectedDay = LocalDate.now().getDayOfWeek();

    public TimetablePanel(AppContext context, MainFrame main) {
        this.context = context;
        this.main = main;
        setLayout(new BorderLayout());
        setBackground(UITheme.BACKGROUND);
        setBorder(BorderFactory.createEmptyBorder(20, 24, 24, 24));
        rebuild();
    }

    @Override
    public void onShown() {
        refresh();
    }

    private void refresh() {
        dayCards.removeAll();
        List<TimetableSlot> slots = context.slotsForFacultyDay(
                context.getCurrentFaculty().getFacultyId(), selectedDay);
        if (slots.isEmpty()) {
            dayCards.add(new com.smartattendance.ui.components.EmptyState(
                    "No classes on this day", "There are no timetable entries for this day."));
        } else {
            for (TimetableSlot slot : slots) {
                dayCards.add(buildSlotCard(slot));
            }
        }
        dayCards.revalidate();
        dayCards.repaint();
    }

    private void rebuild() {
        removeAll();
        add(buildHeader(), BorderLayout.NORTH);
        add(buildDayTabs(), BorderLayout.WEST);

        dayCards.setLayout(new BoxLayout(dayCards, BoxLayout.Y_AXIS));
        dayCards.setOpaque(false);
        JScrollPane scroller = new JScrollPane(dayCards);
        scroller.setBorder(null);
        scroller.getViewport().setBackground(UITheme.BACKGROUND);
        scroller.setHorizontalScrollBarPolicy(JScrollPane.HORIZONTAL_SCROLLBAR_NEVER);
        add(scroller, BorderLayout.CENTER);
    }

    private JPanel buildHeader() {
        JPanel header = new JPanel();
        header.setLayout(new BoxLayout(header, BoxLayout.Y_AXIS));
        header.setOpaque(false);
        header.setBorder(BorderFactory.createEmptyBorder(0, 4, 18, 4));

        JLabel title = UIUtils.pageTitle("Timetable");
        JLabel subtitle = new JLabel("Your recurring weekly schedule. Open a class to start attendance.");
        subtitle.setFont(UITheme.bodyFont());
        subtitle.setForeground(UITheme.TEXT_SECONDARY);

        header.add(title);
        header.add(Box.createVerticalStrut(2));
        header.add(subtitle);
        return header;
    }

    private JPanel buildDayTabs() {
        JPanel tabs = new JPanel(new GridLayout(0, 1, 0, 6));
        tabs.setOpaque(false);
        tabs.setBorder(BorderFactory.createEmptyBorder(6, 6, 6, 18));

        DayOfWeek[] days = {DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY,
                DayOfWeek.THURSDAY, DayOfWeek.FRIDAY};
        for (DayOfWeek day : days) {
            JPanel tab = new JPanel(new BorderLayout());
            tab.setBackground(day == selectedDay ? UITheme.ACCENT_LIGHT : UITheme.SURFACE);
            tab.setBorder(BorderFactory.createCompoundBorder(
                    BorderFactory.createLineBorder(day == selectedDay ? UITheme.ACCENT : UITheme.BORDER),
                    BorderFactory.createEmptyBorder(12, 16, 12, 16)));
            JLabel label = new JLabel(dayName(day));
            label.setFont(day == selectedDay
                    ? UITheme.font(Font.BOLD, UITheme.FONT_SECONDARY)
                    : UITheme.secondaryFont());
            label.setForeground(day == selectedDay ? UITheme.ACCENT : UITheme.TEXT_SECONDARY);
            tab.add(label, BorderLayout.CENTER);
            tab.setCursor(java.awt.Cursor.getPredefinedCursor(java.awt.Cursor.HAND_CURSOR));
            DayOfWeek clicked = day;
            tab.addMouseListener(new java.awt.event.MouseAdapter() {
                @Override
                public void mousePressed(java.awt.event.MouseEvent e) {
                    selectedDay = clicked;
                    refresh();
                    rebuild();
                }
            });
            tabs.add(tab);
        }
        return tabs;
    }

    private JPanel buildSlotCard(TimetableSlot slot) {
        JPanel card = new JPanel(new BorderLayout(16, 0));
        card.setBackground(UITheme.SURFACE);
        card.setBorder(BorderFactory.createCompoundBorder(
                BorderFactory.createLineBorder(UITheme.BORDER),
                BorderFactory.createEmptyBorder(14, 18, 14, 18)));
        card.setMaximumSize(new java.awt.Dimension(Integer.MAX_VALUE, 86));

        JPanel time = new JPanel(new BorderLayout());
        time.setOpaque(false);
        JLabel start = new JLabel(slot.getStartTime().format(TIME));
        start.setFont(UITheme.font(Font.BOLD, 16));
        start.setForeground(UITheme.ACCENT);
        JLabel end = new JLabel("– " + slot.getEndTime().format(TIME));
        end.setFont(UITheme.smallFont());
        end.setForeground(UITheme.TEXT_MUTED);
        time.add(start, BorderLayout.NORTH);
        time.add(end, BorderLayout.SOUTH);
        time.setPreferredSize(new java.awt.Dimension(110, 0));
        card.add(time, BorderLayout.WEST);

        JPanel info = new JPanel();
        info.setLayout(new BoxLayout(info, BoxLayout.Y_AXIS));
        info.setOpaque(false);
        JLabel subject = new JLabel(context.subjectName(slot.getSubjectId()) + "   ·   " + context.subjectCode(slot.getSubjectId()));
        subject.setFont(UITheme.bodyStrongFont());
        subject.setForeground(UITheme.TEXT);
        JLabel where = new JLabel(context.className(slot.getClassId()) + " · Room " + context.roomNumber(slot.getClassroomId()));
        where.setFont(UITheme.secondaryFont());
        where.setForeground(UITheme.TEXT_SECONDARY);
        info.add(subject);
        info.add(Box.createVerticalStrut(3));
        info.add(where);
        card.add(info, BorderLayout.CENTER);

        JPanel actions = new JPanel(new FlowLayout(FlowLayout.RIGHT, 6, 2));
        actions.setOpaque(false);
        boolean onNow = isRunningNow(slot);
        if (onNow) {
            actions.add(UIUtils.badge("In progress", UIUtils.StatusType.SUCCESS));
        }
        var open = UIUtils.button("Open Attendance", UIUtils.ButtonStyle.PRIMARY);
        open.addActionListener(e -> openAttendance(slot));
        actions.add(open);
        card.add(actions, BorderLayout.EAST);
        return card;
    }

    private boolean isRunningNow(TimetableSlot slot) {
        java.time.LocalTime now = java.time.LocalTime.now();
        return !now.isBefore(slot.getStartTime()) && !now.isAfter(slot.getEndTime());
    }

    private void openAttendance(TimetableSlot slot) {
        if (context.getCurrentFaculty() == null) {
            UIUtils.showError(this, "Not signed in", "Sign in as a faculty member to start attendance.");
            return;
        }
        AttendanceSession session = context.openAttendanceForSlot(slot,
                context.getCurrentFaculty().getFacultyId());
        if (session == null) {
            UIUtils.showError(this, "Could not open session",
                    "The attendance session could not be opened for this class. Try again.");
            return;
        }
        context.setActiveSlot(slot);
        main.navigate(Sidebar.Page.ATTENDANCE);
    }

    private String dayName(DayOfWeek day) {
        switch (day) {
            case MONDAY: return "Monday";
            case TUESDAY: return "Tuesday";
            case WEDNESDAY: return "Wednesday";
            case THURSDAY: return "Thursday";
            case FRIDAY: return "Friday";
            case SATURDAY: return "Saturday";
            default: return "Sunday";
        }
    }
}
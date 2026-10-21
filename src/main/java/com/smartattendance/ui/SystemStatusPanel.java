package com.smartattendance.ui;

import com.smartattendance.model.BiometricDevice;

import javax.swing.BorderFactory;
import javax.swing.Box;
import javax.swing.BoxLayout;
import javax.swing.JLabel;
import javax.swing.JPanel;
import java.awt.BorderLayout;
import java.awt.Component;
import java.awt.GridLayout;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;

/**
 * System status: device health, sync pipeline status and totals.
 * Root-cause detail is kept internal; the UI shows friendly, actionable state.
 */
public final class SystemStatusPanel extends JPanel implements RefreshablePanel {

    private static final DateTimeFormatter TIME = DateTimeFormatter.ofPattern("hh:mm a");

    private final AppContext context;

    private final JLabel cardStatus = new JLabel("—");
    private final JLabel irisStatus = new JLabel("—");
    private final JLabel backendStatus = new JLabel("—");
    private final JLabel pendingCount = new JLabel("—");
    private final JLabel syncedCount = new JLabel("—");
    private final JLabel failedCount = new JLabel("—");
    private final JLabel lastSync = new JLabel("—");
    private final JLabel sessionTotal = new JLabel("—");
    private final JLabel recordTotal = new JLabel("—");
    private final javax.swing.JButton refreshButton = UIUtils.button("Refresh", UIUtils.ButtonStyle.SECONDARY);
    private final javax.swing.JButton syncButton = UIUtils.button("Sync Now", UIUtils.ButtonStyle.PRIMARY);
    private final javax.swing.JButton backendToggle = UIUtils.button("Offline Mode", UIUtils.ButtonStyle.SECONDARY);

    public SystemStatusPanel(AppContext context) {
        this.context = context;
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
        refreshButton.addActionListener(e -> refresh());
        syncButton.addActionListener(e -> {
            boolean ok = context.triggerSync();
            context.notifyUiStateChanged();
            UIUtils.showSuccess(this, ok
                    ? "All pending records were synchronized."
                    : "Synchronization finished with some failures (see statuses below).");
            refresh();
        });
        backendToggle.addActionListener(e -> {
            boolean nowOnline = !context.isBackendOnline();
            context.setBackendOnline(nowOnline);
            context.notifyUiStateChanged();
            refresh();
        });

        add(buildHeader(), BorderLayout.NORTH);

        JPanel top = new JPanel(new GridLayout(0, 3, 14, 0));
        top.setOpaque(false);
        top.add(deviceCard("Card Reader", cardStatus));
        top.add(deviceCard("Iris Scanner", irisStatus));
        top.add(syncCard());
        add(top, BorderLayout.CENTER);

        add(buildBottom(), BorderLayout.SOUTH);
    }

    private Component buildHeader() {
        JPanel header = new JPanel(new BorderLayout());
        header.setOpaque(false);
        header.setBorder(BorderFactory.createEmptyBorder(0, 4, 18, 4));

        JPanel text = new JPanel();
        text.setLayout(new BoxLayout(text, BoxLayout.Y_AXIS));
        text.setOpaque(false);
        text.add(UIUtils.pageTitle("System Status"));
        JLabel sub = new JLabel("Devices, synchronization and stored totals across the system.");
        sub.setFont(UITheme.bodyFont());
        sub.setForeground(UITheme.TEXT_SECONDARY);
        text.add(Box.createVerticalStrut(2));
        text.add(sub);
        header.add(text, BorderLayout.WEST);

        JPanel actions = new JPanel(new GridLayout(1, 2, 8, 0));
        actions.setOpaque(false);
        actions.add(refreshButton);
        actions.add(syncButton);
        header.add(actions, BorderLayout.EAST);
        return header;
    }

    private Component deviceCard(String title, JLabel status) {
        JPanel card = surfaceCard();
        card.add(UIUtils.sectionTitle(title));
        card.add(Box.createVerticalStrut(12));
        card.add(statLine("State", status));
        return card;
    }

    private Component syncCard() {
        JPanel card = surfaceCard();
        card.add(UIUtils.sectionTitle("Sync Pipeline"));
        card.add(Box.createVerticalStrut(12));
        card.add(statLine("Backend", backendStatus));
        card.add(Box.createVerticalStrut(6));
        card.add(statLine("Pending", pendingCount));
        card.add(Box.createVerticalStrut(6));
        card.add(statLine("Synced", syncedCount));
        card.add(Box.createVerticalStrut(6));
        card.add(statLine("Failed", failedCount));
        card.add(Box.createVerticalStrut(6));
        card.add(statLine("Last sync", lastSync));
        card.add(Box.createVerticalStrut(16));
        backendToggle.setAlignmentX(Component.LEFT_ALIGNMENT);
        backendToggle.setMaximumSize(new java.awt.Dimension(Integer.MAX_VALUE, backendToggle.getPreferredSize().height));
        card.add(backendToggle);
        return card;
    }

    private Component buildBottom() {
        JPanel card = surfaceCard();
        card.setLayout(new GridLayout(0, 2, 24, 10));
        card.setBorder(BorderFactory.createCompoundBorder(
                BorderFactory.createLineBorder(UITheme.BORDER),
                BorderFactory.createEmptyBorder(16, 20, 16, 20)));
        card.add(statLine("Sessions stored", sessionTotal));
        card.add(statLine("Attendance records", recordTotal));
        return card;
    }

    private JPanel surfaceCard() {
        JPanel card = new JPanel();
        card.setLayout(new BoxLayout(card, BoxLayout.Y_AXIS));
        card.setBackground(UITheme.SURFACE);
        card.setBorder(BorderFactory.createCompoundBorder(
                BorderFactory.createLineBorder(UITheme.BORDER),
                BorderFactory.createEmptyBorder(16, 20, 16, 20)));
        return card;
    }

    private JPanel statLine(String key, JLabel value) {
        JPanel row = new JPanel(new BorderLayout());
        row.setOpaque(false);
        JLabel k = new JLabel(key);
        k.setFont(UITheme.secondaryFont());
        k.setForeground(UITheme.TEXT_SECONDARY);
        value.setFont(UITheme.secondaryFont());
        value.setForeground(UITheme.TEXT);
        value.setHorizontalAlignment(JLabel.RIGHT);
        row.add(k, BorderLayout.WEST);
        row.add(value, BorderLayout.EAST);
        return row;
    }

    // ------------------------------------------------------------------
    // Data
    // ------------------------------------------------------------------

    public void refresh() {
        boolean cardOnline = context.isCardOnline();
        cardStatus.setText(cardOnline ? "● Online" : "○ Offline");
        cardStatus.setForeground(cardOnline ? UITheme.SUCCESS : UITheme.ERROR);

        boolean irisOnline = context.isIrisOnline();
        irisStatus.setText(irisOnline ? "● Online" : "○ Offline");
        irisStatus.setForeground(irisOnline ? UITheme.SUCCESS : UITheme.ERROR);

        boolean backendOnline = context.isBackendOnline();
        backendStatus.setText(backendOnline ? "● Online" : "○ Offline");
        backendStatus.setForeground(backendOnline ? UITheme.SUCCESS : UITheme.ERROR);
        backendToggle.setText(backendOnline ? "Go Offline" : "Go Online");

        Map<String, Integer> status = context.syncStatus();
        pendingCount.setText(String.valueOf(status.getOrDefault("PENDING", 0)));
        syncedCount.setText(String.valueOf(status.getOrDefault("SYNCED", 0)));
        failedCount.setText(String.valueOf(status.getOrDefault("FAILED", 0)));
        LocalDateTime last = context.getLastSyncTime();
        lastSync.setText(last == null ? "never" : last.format(TIME));

        java.util.List<com.smartattendance.model.AttendanceSession> allSessions =
                context.sessions().findAllSessions();
        sessionTotal.setText(String.valueOf(allSessions.size()));
        long totalRecords = 0;
        for (com.smartattendance.model.AttendanceSession session : allSessions) {
            totalRecords += context.sessionRecords(session.getSessionId()).size();
        }
        recordTotal.setText(String.valueOf(totalRecords));
    }
}
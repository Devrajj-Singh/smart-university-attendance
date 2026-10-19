package com.smartattendance.ui;

import com.smartattendance.model.AttendanceSession;
import com.smartattendance.model.FacultyDelegation;
import com.smartattendance.model.Faculty;

import javax.swing.BorderFactory;
import javax.swing.Box;
import javax.swing.BoxLayout;
import javax.swing.JComboBox;
import javax.swing.JComponent;
import javax.swing.JLabel;
import javax.swing.JPanel;
import javax.swing.JScrollPane;
import javax.swing.JTable;
import javax.swing.JTextArea;
import java.awt.BorderLayout;
import java.awt.Component;
import java.awt.Font;
import java.awt.GridLayout;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

/**
 * Faculty delegation: nominate an alternate faculty member to take over an
 * upcoming session, then approve or revoke the delegation.
 */
public final class DelegationPanel extends JPanel implements RefreshablePanel {

    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("EEE, MMM d · hh:mm a");

    private final AppContext context;

    private final JComboBox<String> sessionChooser = new JComboBox<>();
    private final JComboBox<String> alternateChooser = new JComboBox<>();
    private final JTextArea reasonField = new JTextArea(2, 20);
    private final javax.swing.JButton requestButton = UIUtils.button("Request Delegation", UIUtils.ButtonStyle.PRIMARY);
    private final javax.swing.JButton approveButton = UIUtils.button("Approve", UIUtils.ButtonStyle.SUCCESS);
    private final javax.swing.JButton revokeButton = UIUtils.button("Revoke", UIUtils.ButtonStyle.DANGER);
    private final JTable delegationsTable = UIUtils.table(
            new Object[0][0], new String[]{"Delegated to", "Subject", "Reason", "Status", "When"});
    private final JLabel hintLabel = UIUtils.secondary("Request a substitution, then approve it to take effect.");

    public DelegationPanel(AppContext context) {
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
        buildActions();
        add(buildHeader(), BorderLayout.NORTH);
        add(buildBody(), BorderLayout.CENTER);
    }

    private Component buildHeader() {
        JPanel header = new JPanel();
        header.setLayout(new BoxLayout(header, BoxLayout.Y_AXIS));
        header.setOpaque(false);
        header.setBorder(BorderFactory.createEmptyBorder(0, 4, 18, 4));
        header.add(UIUtils.pageTitle("Delegation"));
        JLabel sub = new JLabel("Hand a session to another faculty member when you are unavailable.");
        sub.setFont(UITheme.bodyFont());
        sub.setForeground(UITheme.TEXT_SECONDARY);
        header.add(Box.createVerticalStrut(2));
        header.add(sub);
        return header;
    }

    private Component buildBody() {
        JPanel body = new JPanel(new BorderLayout(0, 16));
        body.setOpaque(false);

        JPanel requestCard = new JPanel();
        requestCard.setLayout(new BoxLayout(requestCard, BoxLayout.Y_AXIS));
        requestCard.setBackground(UITheme.SURFACE);
        requestCard.setBorder(BorderFactory.createCompoundBorder(
                BorderFactory.createLineBorder(UITheme.BORDER),
                BorderFactory.createEmptyBorder(16, 18, 16, 18)));
        requestCard.setPreferredSize(new java.awt.Dimension(360, 0));

        requestCard.add(UIUtils.sectionTitle("New Delegation"));
        requestCard.add(Box.createVerticalStrut(4));
        requestCard.add(hintLabel);
        requestCard.add(Box.createVerticalStrut(14));
        requestCard.add(label("Session"));
        requestCard.add(stretch(sessionChooser));
        requestCard.add(Box.createVerticalStrut(10));
        requestCard.add(label("Alternate faculty"));
        requestCard.add(stretch(alternateChooser));
        requestCard.add(Box.createVerticalStrut(10));
        requestCard.add(label("Reason"));
        reasonField.setFont(UITheme.bodyFont());
        reasonField.setLineWrap(true);
        reasonField.setBackground(UITheme.SURFACE_MUTED);
        reasonField.setBorder(BorderFactory.createCompoundBorder(
                BorderFactory.createLineBorder(UITheme.BORDER),
                BorderFactory.createEmptyBorder(8, 10, 8, 10)));
        reasonField.setMaximumSize(new java.awt.Dimension(Integer.MAX_VALUE, 60));
        requestCard.add(reasonField);
        requestCard.add(Box.createVerticalStrut(14));

        JPanel buttons = new JPanel(new GridLayout(1, 2, 8, 0));
        buttons.setOpaque(false);
        buttons.add(requestButton);
        buttons.add(revokeButton);
        requestCard.add(buttons);
        requestCard.add(Box.createVerticalStrut(8));
        requestCard.add(approveButton);

        body.add(requestCard, BorderLayout.WEST);

        JPanel listCard = new JPanel(new BorderLayout(0, 10));
        listCard.setBackground(UITheme.SURFACE);
        listCard.setBorder(BorderFactory.createCompoundBorder(
                BorderFactory.createLineBorder(UITheme.BORDER),
                BorderFactory.createEmptyBorder(16, 18, 16, 18)));

        JPanel top = new JPanel(new BorderLayout());
        top.setOpaque(false);
        top.add(UIUtils.sectionTitle("Delegations"), BorderLayout.WEST);
        listCard.add(top, BorderLayout.NORTH);
        listCard.add(UIUtils.scroll(delegationsTable), BorderLayout.CENTER);

        body.add(listCard, BorderLayout.CENTER);
        return body;
    }

    private static Component stretch(JComponent component) {
        component.setMaximumSize(new java.awt.Dimension(Integer.MAX_VALUE, component.getPreferredSize().height));
        component.setAlignmentX(Component.LEFT_ALIGNMENT);
        return component;
    }

    private static JLabel label(String text) {
        JLabel l = new JLabel(text);
        l.setFont(UITheme.secondaryFont());
        l.setForeground(UITheme.TEXT_SECONDARY);
        l.setAlignmentX(Component.LEFT_ALIGNMENT);
        return l;
    }

    private void buildActions() {
        requestButton.addActionListener(e -> requestDelegation());
        approveButton.addActionListener(e -> approveSelected());
        revokeButton.addActionListener(e -> revokeSelected());
    }

    // ------------------------------------------------------------------
    // Data
    // ------------------------------------------------------------------

    public void refresh() {
        refreshChoosers();
        refreshDelegationsTable();
    }

    private List<AttendanceSession> sessions() {
        if (context.getCurrentFaculty() == null) {
            return new ArrayList<>();
        }
        return context.todaySessionsForFaculty(context.getCurrentFaculty().getFacultyId());
    }

    private void refreshChoosers() {
        List<AttendanceSession> sessions = sessions();
        String saved = (String) sessionChooser.getSelectedItem();
        sessionChooser.removeAllItems();
        for (AttendanceSession session : sessions) {
            sessionChooser.addItem(context.subjectName(session.getSubjectId()) + " · "
                    + context.className(session.getClassId()) + " · "
                    + DATE.format(session.getStartTime()));
        }
        if (saved != null && sessionChooser.getItemCount() > 0) {
            sessionChooser.setSelectedItem(saved);
        }

        alternateChooser.removeAllItems();
        String current = context.getCurrentFaculty().getFacultyId();
        for (String facultyId : context.allFacultyIds()) {
            if (!facultyId.equals(current)) {
                alternateChooser.addItem(facultyId + " — " + context.facultyName(facultyId));
            }
        }
    }

    private void refreshDelegationsTable() {
        List<AttendanceSession> sessions = sessions();
        List<Object[]> rows = new ArrayList<>();
        if (context.getCurrentFaculty() != null) {
            for (FacultyDelegation delegation :
                    context.delegation().getFacultyDelegations(context.getCurrentFaculty().getFacultyId())) {
                String subject = "—";
                for (AttendanceSession session : sessions) {
                    if (session.getSessionId().equals(delegation.getSessionId())) {
                        subject = context.subjectName(session.getSubjectId());
                        break;
                    }
                }
                rows.add(new Object[]{
                        context.facultyName(delegation.getAlternateFaculty()),
                        subject,
                        delegation.getReason() == null || delegation.getReason().isBlank()
                                ? "—" : delegation.getReason(),
                        delegation.getStatus(),
                        delegation.getTimestamp() == null ? "—" : delegation.getTimestamp().format(DATE)
                });
            }
        }
        delegationsTable.setModel(new javax.swing.table.DefaultTableModel(
                rows.toArray(new Object[0][]),
                new String[]{"Delegated to", "Subject", "Reason", "Status", "When"}) {
            @Override
            public boolean isCellEditable(int row, int column) {
                return false;
            }
        });
        UIUtils.configureTable(delegationsTable);
    }

    private void requestDelegation() {
        AttendanceSession session = selectedSession();
        Object alt = alternateChooser.getSelectedItem();
        if (session == null || alt == null) {
            UIUtils.showError(this, "Incomplete form", "Choose a session and an alternate faculty member.");
            return;
        }
        String alternateId = alt.toString().split(" — ")[0].trim();
        if (context.delegation().getActiveDelegation(session.getSessionId()) != null) {
            UIUtils.showError(this, "Already delegated", "This session already has an active delegation.");
            return;
        }
        FacultyDelegation delegation = context.delegation().requestDelegation(
                session.getSessionId(),
                context.getCurrentFaculty().getFacultyId(),
                alternateId,
                reasonField.getText().trim());
        if (delegation == null) {
            UIUtils.showError(this, "Could not delegate", "The delegation request was not valid.");
            return;
        }
        UIUtils.showSuccess(this, "Delegation requested. Approve it below to map the alternate faculty to the session.");
        reasonField.setText("");
        refresh();
    }

    private void approveSelected() {
        FacultyDelegation delegation = selectedDelegation();
        if (delegation == null) {
            UIUtils.showError(this, "No delegation selected", "Select a pending delegation row to approve.");
            return;
        }
        if (!"PENDING".equals(delegation.getStatus())) {
            UIUtils.showInfo(this, "This delegation is " + delegation.getStatus().toLowerCase() + ".");
            return;
        }
        context.delegation().approveDelegation(delegation.getDelegationId());
        UIUtils.showSuccess(this, "Delegation approved. The alternate faculty now covers the session.");
        refresh();
    }

    private void revokeSelected() {
        FacultyDelegation delegation = selectedDelegation();
        if (delegation == null) {
            UIUtils.showError(this, "No delegation selected", "Select a delegation row to revoke.");
            return;
        }
        if (!UIUtils.confirm(this, "Revoke delegation",
                "Revoke this delegation? The original faculty will cover the session again.")) {
            return;
        }
        context.delegation().revokeDelegationQuietly(delegation.getDelegationId());
        UIUtils.showSuccess(this, "Delegation revoked.");
        refresh();
    }

    private AttendanceSession selectedSession() {
        List<AttendanceSession> sessions = sessions();
        int idx = sessionChooser.getSelectedIndex();
        if (idx >= 0 && idx < sessions.size()) {
            return sessions.get(idx);
        }
        return null;
    }

    private FacultyDelegation selectedDelegation() {
        List<FacultyDelegation> delegations =
                context.delegation().getFacultyDelegations(context.getCurrentFaculty().getFacultyId());
        int idx = delegationsTable.getSelectedRow();
        if (idx >= 0 && idx < delegations.size()) {
            return delegations.get(idx);
        }
        return null;
    }
}
package com.smartattendance.ui;

import com.smartattendance.model.BiometricDevice;

import javax.swing.BorderFactory;
import javax.swing.Box;
import javax.swing.BoxLayout;
import javax.swing.JButton;
import javax.swing.JFileChooser;
import javax.swing.JLabel;
import javax.swing.JPanel;
import javax.swing.JTextField;
import java.awt.BorderLayout;
import java.awt.Component;
import java.awt.GridLayout;
import java.io.File;

/**
 * Stand-in for the physical readers on campus. Toggling a device offline
 * stops accepted scans; simulating a card / iris scan pushes an
 * AuthenticationResult into the shared event channel which the live
 * Attendance screen is listening on.
 */
public final class DeviceSimulatorPanel extends JPanel implements RefreshablePanel {

    private final AppContext context;

    private final JLabel cardStatus = new JLabel();
    private final JLabel irisStatus = new JLabel();
    private final JTextField cardReg = new JTextField("25215101");
    private final JTextField irisReg = new JTextField("25215101");
    private final JButton cardOnlineBtn = UIUtils.button("Go Online", UIUtils.ButtonStyle.PRIMARY);
    private final JButton cardOfflineBtn = UIUtils.button("Go Offline", UIUtils.ButtonStyle.SECONDARY);
    private final JButton irisOnlineBtn = UIUtils.button("Go Online", UIUtils.ButtonStyle.PRIMARY);
    private final JButton irisOfflineBtn = UIUtils.button("Go Offline", UIUtils.ButtonStyle.SECONDARY);

    public DeviceSimulatorPanel(AppContext context) {
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
        add(buildHeader(), BorderLayout.NORTH);

        JPanel grid = new JPanel(new GridLayout(0, 2, 16, 0));
        grid.setOpaque(false);
        grid.add(buildCardReader());
        grid.add(buildIrisReader());
        add(grid, BorderLayout.CENTER);

        add(buildHelpCard(), BorderLayout.SOUTH);
    }

    private Component buildHeader() {
        JPanel header = new JPanel();
        header.setLayout(new BoxLayout(header, BoxLayout.Y_AXIS));
        header.setOpaque(false);
        header.setBorder(BorderFactory.createEmptyBorder(0, 4, 18, 4));
        header.add(UIUtils.pageTitle("Device Simulator"));
        JLabel sub = new JLabel("Simulate the biometric readers. Results stream straight into the Attendance screen.");
        sub.setFont(UITheme.bodyFont());
        sub.setForeground(UITheme.TEXT_SECONDARY);
        header.add(Box.createVerticalStrut(2));
        header.add(sub);
        return header;
    }

    private Component buildCardReader() {
        JPanel card = readerCard("Card Reader", "IDCardAuthentication sim");
        card.add(deviceRow(cardStatus, cardOnlineBtn, cardOfflineBtn));
        card.add(Box.createVerticalStrut(14));
        card.add(fieldLabel("Registration number for the card"));
        card.add(field(cardReg));
        card.add(Box.createVerticalStrut(10));
        JButton scan = UIUtils.button("Present Card", UIUtils.ButtonStyle.PRIMARY);
        scan.addActionListener(e -> {
            context.simulateCardScan(cardReg.getText().trim());
            context.notifyUiStateChanged();
        });
        card.add(scan);

        cardOnlineBtn.addActionListener(e -> {
            context.setCardOnline(true);
            refresh();
        });
        cardOfflineBtn.addActionListener(e -> {
            context.setCardOnline(false);
            refresh();
        });
        return card;
    }

    private Component buildIrisReader() {
        JPanel card = readerCard("Iris Scanner", "IrisAuthentication sim");
        card.add(deviceRow(irisStatus, irisOnlineBtn, irisOfflineBtn));
        card.add(Box.createVerticalStrut(14));
        card.add(fieldLabel("Registration number for the iris"));
        card.add(field(irisReg));
        card.add(Box.createVerticalStrut(10));

        JPanel buttons = new JPanel(new GridLayout(1, 3, 8, 0));
        buttons.setOpaque(false);
        JButton approve = UIUtils.button("Approve", UIUtils.ButtonStyle.SUCCESS);
        approve.addActionListener(e -> {
            context.simulateIrisApproved(irisReg.getText().trim());
            context.notifyUiStateChanged();
        });
        JButton reject = UIUtils.button("Mismatch", UIUtils.ButtonStyle.DANGER);
        reject.addActionListener(e -> {
            context.simulateIrisFailed(irisReg.getText().trim());
            context.notifyUiStateChanged();
        });
        JButton file = UIUtils.button("From Image", UIUtils.ButtonStyle.SECONDARY);
        file.addActionListener(e -> simulateIrisFromFile());
        buttons.add(approve);
        buttons.add(reject);
        buttons.add(file);
        card.add(buttons);

        irisOnlineBtn.addActionListener(e -> {
            context.setIrisOnline(true);
            refresh();
        });
        irisOfflineBtn.addActionListener(e -> {
            context.setIrisOnline(false);
            refresh();
        });
        return card;
    }

    private JPanel readerCard(String title, String subtitle) {
        JPanel card = new JPanel();
        card.setLayout(new BoxLayout(card, BoxLayout.Y_AXIS));
        card.setBackground(UITheme.SURFACE);
        card.setBorder(BorderFactory.createCompoundBorder(
                BorderFactory.createLineBorder(UITheme.BORDER),
                BorderFactory.createEmptyBorder(18, 20, 18, 20)));
        card.add(UIUtils.sectionTitle(title));
        card.add(Box.createVerticalStrut(2));
        JLabel sub = new JLabel(subtitle);
        sub.setFont(UITheme.smallFont());
        sub.setForeground(UITheme.TEXT_MUTED);
        sub.setAlignmentX(Component.LEFT_ALIGNMENT);
        card.add(sub);
        card.add(Box.createVerticalStrut(14));
        return card;
    }

    private JPanel deviceRow(JLabel status, JButton online, JButton offline) {
        JPanel row = new JPanel(new BorderLayout(8, 0));
        row.setOpaque(false);
        row.add(status, BorderLayout.WEST);
        JPanel buttons = new JPanel(new GridLayout(1, 2, 6, 0));
        buttons.setOpaque(false);
        buttons.add(online);
        buttons.add(offline);
        row.add(buttons, BorderLayout.EAST);
        return row;
    }

    private Component buildHelpCard() {
        JPanel card = new JPanel(new BorderLayout());
        card.setBackground(UITheme.SURFACE);
        card.setBorder(BorderFactory.createCompoundBorder(
                BorderFactory.createLineBorder(UITheme.BORDER),
                BorderFactory.createEmptyBorder(12, 18, 12, 18)));
        JLabel text = new JLabel("<html>Tip: open the <b>Attendance</b> screen, choose a session, and scan a card here. "
                + "The card + iris results appear live in the attendance capture log.</html>");
        text.setFont(UITheme.bodyFont());
        text.setForeground(UITheme.TEXT_SECONDARY);
        card.add(text, BorderLayout.CENTER);
        return card;
    }

    private static JLabel fieldLabel(String text) {
        JLabel l = new JLabel(text);
        l.setFont(UITheme.secondaryFont());
        l.setForeground(UITheme.TEXT_SECONDARY);
        l.setAlignmentX(Component.LEFT_ALIGNMENT);
        return l;
    }

    private static Component field(JTextField field) {
        field.setFont(UITheme.bodyFont());
        field.setBackground(UITheme.SURFACE_MUTED);
        field.setBorder(BorderFactory.createCompoundBorder(
                BorderFactory.createLineBorder(UITheme.BORDER),
                BorderFactory.createEmptyBorder(9, 10, 9, 10)));
        field.setAlignmentX(Component.LEFT_ALIGNMENT);
        field.setMaximumSize(new java.awt.Dimension(Integer.MAX_VALUE, 40));
        return field;
    }

    private void simulateIrisFromFile() {
        JFileChooser chooser = new JFileChooser();
        chooser.setDialogTitle("Choose an iris image (filename should contain the registration number)");
        if (chooser.showOpenDialog(this) == JFileChooser.APPROVE_OPTION) {
            File image = chooser.getSelectedFile();
            context.simulateIrisUpload(irisReg.getText().trim(), image);
            context.notifyUiStateChanged();
        }
    }

    public void refresh() {
        boolean cardOnline = context.isCardOnline();
        cardStatus.setText((cardOnline ? "● Online" : "○ Offline"));
        cardStatus.setFont(UITheme.bodyStrongFont());
        cardStatus.setForeground(cardOnline ? UITheme.SUCCESS : UITheme.ERROR);
        cardStatus.setAlignmentX(Component.LEFT_ALIGNMENT);
        cardOnlineBtn.setEnabled(!cardOnline);
        cardOfflineBtn.setEnabled(cardOnline);

        boolean irisOnline = context.isIrisOnline();
        irisStatus.setText((irisOnline ? "● Online" : "○ Offline"));
        irisStatus.setFont(UITheme.bodyStrongFont());
        irisStatus.setForeground(irisOnline ? UITheme.SUCCESS : UITheme.ERROR);
        irisStatus.setAlignmentX(Component.LEFT_ALIGNMENT);
        irisOnlineBtn.setEnabled(!irisOnline);
        irisOfflineBtn.setEnabled(irisOnline);
    }
}
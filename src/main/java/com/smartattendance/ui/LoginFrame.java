package com.smartattendance.ui;

import com.smartattendance.dashboard.LoginService;
import com.smartattendance.exceptions.AuthenticationException;
import com.smartattendance.model.Faculty;
import com.smartattendance.ui.components.RoundedButton;

import javax.swing.BorderFactory;
import javax.swing.Box;
import javax.swing.BoxLayout;
import javax.swing.JComboBox;
import javax.swing.JComponent;
import javax.swing.JFrame;
import javax.swing.JLabel;
import javax.swing.JPanel;
import javax.swing.JPasswordField;
import javax.swing.JTextField;
import javax.swing.SwingConstants;
import javax.swing.SwingUtilities;
import java.awt.BorderLayout;
import java.awt.Color;
import java.awt.Component;
import java.awt.Dimension;
import java.awt.FlowLayout;
import java.awt.Font;
import java.awt.GridBagConstraints;
import java.awt.GridBagLayout;
import java.awt.Insets;
import java.awt.event.ActionEvent;
import java.awt.event.KeyAdapter;
import java.awt.event.KeyEvent;

/**
 * Faculty sign-in screen. Validates through the existing LoginService and
 * hands the signed-in Faculty to the application context.
 */
public final class LoginFrame extends JFrame {

    private final AppContext context;
    private final JTextField idField = new JTextField("F001", 18);
    private final JPasswordField passwordField = new JPasswordField(18);
    private final JLabel errorLabel = new JLabel(" ");
    private final RoundedButton signInButton = UIUtils.button("Sign In", UIUtils.ButtonStyle.PRIMARY);

    public LoginFrame(AppContext context) {
        this.context = context;
        setTitle("Smart University Attendance Management");
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        setSize(980, 600);
        setMinimumSize(new Dimension(840, 520));
        setLocationRelativeTo(null);

        buildContent();
        wireActions();
        setVisible(true);
    }

    private void buildContent() {
        JPanel root = new JPanel(new BorderLayout());
        root.setBackground(UITheme.BACKGROUND);
        root.add(buildBranding(), BorderLayout.WEST);
        root.add(buildForm(), BorderLayout.CENTER);
        setContentPane(root);
    }

    private JComponent buildBranding() {
        JPanel panel = new JPanel(new BorderLayout());
        panel.setBackground(UITheme.SIDEBAR_BG);
        panel.setPreferredSize(new Dimension(420, 0));

        JPanel inner = new JPanel();
        inner.setLayout(new BoxLayout(inner, BoxLayout.Y_AXIS));
        inner.setOpaque(false);
        inner.setBorder(BorderFactory.createEmptyBorder(48, 44, 40, 44));

        JLabel mark = new JLabel("◆");
        mark.setFont(UITheme.font(Font.BOLD, 26));
        mark.setForeground(UITheme.ACCENT);
        mark.setAlignmentX(Component.LEFT_ALIGNMENT);

        inner.add(mark);
        inner.add(Box.createVerticalStrut(14));

        JLabel name = new JLabel("Smart University");
        name.setFont(UITheme.font(Font.BOLD, 24));
        name.setForeground(Color.WHITE);
        name.setAlignmentX(Component.LEFT_ALIGNMENT);
        inner.add(name);

        JLabel subtitle = new JLabel("Attendance Management System");
        subtitle.setFont(UITheme.font(Font.PLAIN, 14));
        subtitle.setForeground(UITheme.TEXT_ON_DARK_MUTED);
        subtitle.setAlignmentX(Component.LEFT_ALIGNMENT);
        inner.add(subtitle);

        inner.add(Box.createVerticalStrut(34));

        inner.add(featureItem("Biometric card + iris verification"));
        inner.add(Box.createVerticalStrut(10));
        inner.add(featureItem("Automatic and manual session capture"));
        inner.add(Box.createVerticalStrut(10));
        inner.add(featureItem("Offline sync queue with live status"));
        inner.add(Box.createVerticalStrut(10));
        inner.add(featureItem("Attendance reports and faculty delegation"));

        panel.add(inner, BorderLayout.NORTH);

        JLabel footer = new JLabel("v1.0  ·  Academic demonstration build");
        footer.setFont(UITheme.smallFont());
        footer.setForeground(UITheme.TEXT_ON_DARK_MUTED);
        footer.setBorder(BorderFactory.createEmptyBorder(0, 44, 22, 44));
        panel.add(footer, BorderLayout.SOUTH);
        return panel;
    }

    private JLabel featureItem(String text) {
        JLabel label = new JLabel("●  " + text);
        label.setFont(UITheme.bodyFont());
        label.setForeground(UITheme.TEXT_ON_DARK);
        label.setAlignmentX(Component.LEFT_ALIGNMENT);
        return label;
    }

    private JComponent buildForm() {
        JPanel wrapper = new JPanel(new GridBagLayout());
        wrapper.setBackground(UITheme.BACKGROUND);
        wrapper.setBorder(BorderFactory.createEmptyBorder(40, 44, 40, 44));

        JPanel card = new JPanel();
        card.setLayout(new BoxLayout(card, BoxLayout.Y_AXIS));
        card.setBackground(UITheme.SURFACE);
        card.setBorder(BorderFactory.createCompoundBorder(
                UIUtils.padding(30, 34, 30, 34),
                BorderFactory.createLineBorder(UITheme.BORDER, 1, true)));
        card.setPreferredSize(new Dimension(360, 420));
        card.setMaximumSize(new Dimension(380, 480));

        JLabel heading = new JLabel("Welcome back");
        heading.setFont(UITheme.pageTitleFont());
        heading.setForeground(UITheme.TEXT);
        heading.setAlignmentX(Component.LEFT_ALIGNMENT);
        card.add(heading);

        card.add(Box.createVerticalStrut(4));
        JLabel sub = new JLabel("Sign in with your faculty account to continue.");
        sub.setFont(UITheme.secondaryFont());
        sub.setForeground(UITheme.TEXT_SECONDARY);
        sub.setAlignmentX(Component.LEFT_ALIGNMENT);
        card.add(sub);

        card.add(Box.createVerticalStrut(22));

        card.add(formRow("Faculty ID", idField));
        card.add(Box.createVerticalStrut(12));
        card.add(formRow("Password", passwordField));

        card.add(Box.createVerticalStrut(6));
        errorLabel.setFont(UITheme.secondaryFont());
        errorLabel.setForeground(UITheme.ERROR);
        errorLabel.setAlignmentX(Component.LEFT_ALIGNMENT);
        card.add(errorLabel);

        card.add(Box.createVerticalStrut(14));

        signInButton.setAlignmentX(Component.LEFT_ALIGNMENT);
        signInButton.setMinimumSize(new Dimension(150, 42));
        signInButton.setMaximumSize(new Dimension(150, 42));
        card.add(signInButton);

        card.add(Box.createVerticalStrut(24));

        JLabel quickLabel = new JLabel("Quick select (demo credentials)");
        quickLabel.setFont(UITheme.smallFont());
        quickLabel.setForeground(UITheme.TEXT_MUTED);
        quickLabel.setAlignmentX(Component.LEFT_ALIGNMENT);
        card.add(quickLabel);

        card.add(Box.createVerticalStrut(6));

        LoginService loginService = context.login();
        JComboBox<String> quick = new JComboBox<>();
        quick.setFont(UITheme.bodyFont());
        for (String id : loginService.getAvailableFacultyIds()) {
            if (id.equals("F004")) {
                continue;
            }
            String name = loginService.getFacultyName(id);
            quick.addItem(id + " — " + (name == null ? id : name));
        }
        quick.setMaximumSize(new Dimension(340, 34));
        quick.setAlignmentX(Component.LEFT_ALIGNMENT);
        card.add(quick);

        card.add(Box.createVerticalStrut(10));
        JLabel hint = new JLabel("");
        hint.setFont(UITheme.smallFont());
        hint.setForeground(UITheme.TEXT_MUTED);
        quick.addActionListener(e -> {
            Object selected = quick.getSelectedItem();
            if (selected != null) {
                String id = selected.toString().split(" — ")[0];
                idField.setText(id);
            }
        });
        quick.setSelectedIndex(0);
        card.add(hint);

        JPanel hintRow = new JPanel(new FlowLayout(FlowLayout.LEFT, 0, 0));
        hintRow.setOpaque(false);
        JLabel lock = new JLabel("Password for all demo accounts: faculty123");
        lock.setFont(UITheme.smallFont());
        lock.setForeground(UITheme.TEXT_MUTED);
        hintRow.add(lock);
        card.add(hintRow);

        GridBagConstraints gbc = new GridBagConstraints();
        gbc.gridx = 0;
        gbc.gridy = 0;
        gbc.weightx = 1.0;
        gbc.weighty = 1.0;
        gbc.fill = GridBagConstraints.NONE;
        wrapper.add(card, gbc);
        return wrapper;
    }

    private JPanel formRow(String labelText, JComponent field) {
        JPanel row = new JPanel();
        row.setLayout(new BoxLayout(row, BoxLayout.Y_AXIS));
        row.setOpaque(false);
        row.setAlignmentX(Component.LEFT_ALIGNMENT);

        JLabel label = new JLabel(labelText);
        label.setFont(UITheme.secondaryFont());
        label.setForeground(UITheme.TEXT_SECONDARY);
        label.setAlignmentX(Component.LEFT_ALIGNMENT);
        row.add(label);
        row.add(Box.createVerticalStrut(5));

        field.setFont(UITheme.bodyFont());
        field.setForeground(UITheme.TEXT);
        field.setBackground(UITheme.SURFACE_MUTED);
        field.setBorder(BorderFactory.createCompoundBorder(
                BorderFactory.createLineBorder(UITheme.BORDER),
                BorderFactory.createEmptyBorder(9, 10, 9, 10)));
        field.setAlignmentX(Component.LEFT_ALIGNMENT);
        field.setMaximumSize(new Dimension(340, 40));
        row.add(field);
        return row;
    }

    private void wireActions() {
        signInButton.addActionListener(this::attemptLogin);

        KeyAdapter enter = new KeyAdapter() {
            @Override
            public void keyPressed(KeyEvent e) {
                if (e.getKeyCode() == KeyEvent.VK_ENTER) {
                    attemptLogin(null);
                }
            }
        };
        idField.addKeyListener(enter);
        passwordField.addKeyListener(enter);
    }

    private void attemptLogin(ActionEvent ignored) {
        String id = idField.getText().trim();
        String password = new String(passwordField.getPassword());
        signInButton.setEnabled(false);
        errorLabel.setText(" ");

        UIUtils.runAsync(
                () -> context.login().login(id, password),
                this::onLoginSuccess,
                error -> SwingUtilities.invokeLater(() -> {
                    signInButton.setEnabled(true);
                    if (error instanceof AuthenticationException || error.getCause() instanceof AuthenticationException) {
                        errorLabel.setText("× " + error.getMessage());
                    } else {
                        errorLabel.setText("× Could not reach the authentication service. Try again.");
                    }
                }));
    }

    private void onLoginSuccess(Faculty faculty) {
        signInButton.setEnabled(true);
        context.setCurrentFaculty(faculty);
        dispose();
        new MainFrame(context).setVisible(true);
    }
}
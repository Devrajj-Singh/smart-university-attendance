package com.smartattendance.ui;

import com.smartattendance.ui.components.RoundedButton;
import com.smartattendance.ui.components.StatusBadge;
import com.smartattendance.ui.components.StyledCardPanel;

import javax.swing.BorderFactory;
import javax.swing.JComponent;
import javax.swing.JLabel;
import javax.swing.JOptionPane;
import javax.swing.JPanel;
import javax.swing.JScrollPane;
import javax.swing.JTable;
import javax.swing.JTextArea;
import javax.swing.SwingConstants;
import javax.swing.SwingUtilities;
import javax.swing.SwingWorker;
import javax.swing.UIManager;
import javax.swing.border.Border;
import javax.swing.table.DefaultTableCellRenderer;
import java.awt.BorderLayout;
import java.awt.Color;
import java.awt.Component;
import java.awt.Font;
import java.awt.Window;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.function.Consumer;

/**
 * Shared UI building blocks: buttons, badges, labels, tables, empty states,
 * dialogs, and a small SwingWorker helper so panels never freeze the EDT.
 */
public final class UIUtils {

    private UIUtils() {
    }

    public enum ButtonStyle {
        PRIMARY, SECONDARY, DANGER, SUCCESS, GHOST
    }

    public enum StatusType {
        SUCCESS, WARNING, ERROR, INFO, NEUTRAL, DARK
    }

    // ---------------------------------------------------------------
    // Buttons
    // ---------------------------------------------------------------

    public static RoundedButton button(String label, ButtonStyle style) {
        switch (style) {
            case PRIMARY:
                return new RoundedButton(label, UITheme.ACCENT, new Color(0x24, 0x5F, 0xD0),
                        Color.WHITE, UITheme.ACCENT);
            case SUCCESS:
                return new RoundedButton(label, UITheme.SUCCESS, new Color(0x16, 0x6A, 0x3B),
                        Color.WHITE, UITheme.SUCCESS);
            case DANGER:
                return new RoundedButton(label, new Color(0xD7, 0x4B, 0x43), new Color(0xB3, 0x26, 0x1E),
                        Color.WHITE, new Color(0xD7, 0x4B, 0x43));
            case GHOST:
                return new RoundedButton(label, UITheme.ACCENT_LIGHT, new Color(0xD9, 0xE6, 0xFA),
                        UITheme.ACCENT, UITheme.ACCENT_LIGHT);
            case SECONDARY:
            default:
                return new RoundedButton(label, UITheme.SURFACE, UITheme.SURFACE_MUTED,
                        UITheme.TEXT_SECONDARY, UITheme.BORDER);
        }
    }

    // ---------------------------------------------------------------
    // Status badges
    // ---------------------------------------------------------------

    public static StatusBadge badge(String text, StatusType type) {
        switch (type) {
            case SUCCESS:
                return new StatusBadge("✓ " + text, UITheme.SUCCESS_BG, UITheme.SUCCESS);
            case WARNING:
                return new StatusBadge("⚠ " + text, UITheme.WARNING_BG, UITheme.WARNING);
            case ERROR:
                return new StatusBadge("✕ " + text, UITheme.ERROR_BG, UITheme.ERROR);
            case DARK:
                return new StatusBadge("● " + text, new Color(0x2A, 0x38, 0x4D), Color.WHITE);
            case NEUTRAL:
            default:
                return new StatusBadge(text, UITheme.SURFACE_MUTED, UITheme.TEXT_SECONDARY);
        }
    }

    public static StatusBadge badge(String text, String typeId) {
        return badge(text, statusType(typeId));
    }

    public static StatusType statusType(String typeId) {
        if (typeId == null) {
            return StatusType.NEUTRAL;
        }
        String upper = typeId.trim().toUpperCase();
        switch (upper) {
            case "PRESENT":
            case "SUCCESS":
            case "SYNCED":
            case "ACTIVE":
            case "ONLINE":
            case "ACTIVE_SESSION":
            case "APPROVED":
                return StatusType.SUCCESS;
            case "LATE":
            case "WARNING":
            case "PENDING":
            case "EXPIRED":
                return StatusType.WARNING;
            case "ABSENT":
            case "FAILED":
            case "ERROR":
            case "REVOKED":
            case "OFFLINE":
            case "REJECTED":
            case "BIOMETRIC_MISMATCH":
            case "INVALID_CARD":
            case "UNKNOWN_USER":
            case "DEVICE_ERROR":
                return StatusType.ERROR;
            case "INFO":
            case "CARD":
            case "IRIS":
            case "CARD_AND_IRIS":
            case "MANUAL":
            case "AUTOMATIC":
                return StatusType.INFO;
            default:
                return StatusType.NEUTRAL;
        }
    }

    // ---------------------------------------------------------------
    // Labels / typography
    // ---------------------------------------------------------------

    public static JLabel title(String text) {
        JLabel label = new JLabel(text);
        label.setFont(UITheme.titleFont());
        label.setForeground(UITheme.TEXT);
        return label;
    }

    public static JLabel pageTitle(String text) {
        JLabel label = new JLabel(text);
        label.setFont(UITheme.pageTitleFont());
        label.setForeground(UITheme.TEXT);
        return label;
    }

    public static JLabel sectionTitle(String text) {
        JLabel label = new JLabel(text);
        label.setFont(UITheme.sectionTitleFont());
        label.setForeground(UITheme.TEXT);
        return label;
    }

    public static JLabel body(String text) {
        JLabel label = new JLabel(text);
        label.setFont(UITheme.bodyFont());
        label.setForeground(UITheme.TEXT);
        return label;
    }

    public static JLabel bodyStrong(String text) {
        JLabel label = new JLabel(text);
        label.setFont(UITheme.bodyStrongFont());
        label.setForeground(UITheme.TEXT);
        return label;
    }

    public static JLabel secondary(String text) {
        JLabel label = new JLabel(text);
        label.setFont(UITheme.secondaryFont());
        label.setForeground(UITheme.TEXT_SECONDARY);
        return label;
    }

    public static JLabel small(String text) {
        JLabel label = new JLabel(text);
        label.setFont(UITheme.smallFont());
        label.setForeground(UITheme.TEXT_MUTED);
        return label;
    }

    public static Border padding(int top, int left, int bottom, int right) {
        return BorderFactory.createEmptyBorder(top, left, bottom, right);
    }

    // ---------------------------------------------------------------
    // Cards
    // ---------------------------------------------------------------

    public static StyledCardPanel card() {
        return new StyledCardPanel(new BorderLayout(0, 0));
    }

    public static StyledCardPanel cardPanel(int horizontalGap, int verticalGap) {
        return new StyledCardPanel(new BorderLayout(horizontalGap, verticalGap));
    }

    // ---------------------------------------------------------------
    // Table configuration
    // ---------------------------------------------------------------

    public static JScrollPane scroll(JComponent view) {
        JScrollPane pane = new JScrollPane(view);
        pane.setBorder(BorderFactory.createLineBorder(UITheme.BORDER));
        pane.setBackground(UITheme.SURFACE);
        pane.getViewport().setBackground(UITheme.SURFACE);
        return pane;
    }

    public static void configureTable(JTable table) {
        table.setFont(UITheme.bodyFont());
        table.setRowHeight(34);
        table.setGridColor(UITheme.BORDER);
        table.setShowVerticalLines(false);
        table.setSelectionBackground(UITheme.ACCENT_LIGHT);
        table.setSelectionForeground(UITheme.TEXT);
        table.setFillsViewportHeight(false);
        table.getTableHeader().setReorderingAllowed(false);
        table.getTableHeader().setFont(UITheme.font(Font.BOLD, UITheme.FONT_SECONDARY));
        table.getTableHeader().setBackground(UITheme.SURFACE_MUTED);
        table.getTableHeader().setForeground(UITheme.TEXT_SECONDARY);
        table.getTableHeader().setBorder(BorderFactory.createLineBorder(UITheme.BORDER));

        DefaultTableCellRenderer renderer = new DefaultTableCellRenderer();
        renderer.setBorder(BorderFactory.createEmptyBorder(0, 10, 0, 10));
        renderer.setForeground(UITheme.TEXT);
        table.setDefaultRenderer(Object.class, renderer);
        for (int i = 0; i < table.getColumnCount(); i++) {
            table.getColumnModel().getColumn(i).setCellRenderer(renderer);
        }
    }

    public static JTable table(Object[][] rows, String[] columns) {
        JTable table = new JTable(rows, columns);
        configureTable(table);
        return table;
    }

    // ---------------------------------------------------------------
    // Empty state
    // ---------------------------------------------------------------

    public static JPanel emptyState(String headline, String caption) {
        return new com.smartattendance.ui.components.EmptyState(headline, caption);
    }

    public static JPanel emptyState(String headline) {
        return emptyState(headline, null);
    }

    // ---------------------------------------------------------------
    // Dialog helpers (user-friendly messages; no stack traces)
    // ---------------------------------------------------------------

    public static void showError(Component parent, String title, String message) {
        JOptionPane.showMessageDialog(parent, styledMessage(message, UITheme.ERROR, UITheme.ERROR_BG),
                title, JOptionPane.ERROR_MESSAGE);
    }

    public static void showError(Component parent, String message) {
        showError(parent, "Something went wrong", message);
    }

    public static void showSuccess(Component parent, String message) {
        JOptionPane.showMessageDialog(parent, styledMessage(message, UITheme.SUCCESS, UITheme.SUCCESS_BG),
                "Success", JOptionPane.PLAIN_MESSAGE);
    }

    public static void showInfo(Component parent, String message) {
        JOptionPane.showMessageDialog(parent, styledMessage(message, UITheme.INFO, UITheme.INFO_BG),
                "Information", JOptionPane.INFORMATION_MESSAGE);
    }

    public static void showUnexpectedError(Component parent, Throwable error) {
        JTextArea details = new JTextArea();
        details.setFont(UITheme.secondaryFont());
        details.setForeground(UITheme.TEXT_SECONDARY);
        details.setEditable(false);
        details.setText("Something went wrong while processing the request.\n\nTechnical details: "
                + (error == null ? "unknown" : error.getMessage()));
        JOptionPane.showMessageDialog(parent, details, "Something went wrong", JOptionPane.WARNING_MESSAGE);
    }

    public static boolean confirm(Component parent, String title, String message) {
        JPanel panel = new JPanel(new BorderLayout());
        JLabel label = new JLabel(message);
        label.setFont(UITheme.bodyFont());
        label.setForeground(UITheme.TEXT);
        label.setBorder(BorderFactory.createEmptyBorder(12, 16, 12, 16));
        panel.add(label, BorderLayout.CENTER);
        int choice = JOptionPane.showConfirmDialog(parent, panel, title,
                JOptionPane.OK_CANCEL_OPTION, JOptionPane.PLAIN_MESSAGE);
        return choice == JOptionPane.OK_OPTION;
    }

    private static JComponent styledMessage(String message, Color fg, Color bg) {
        JPanel panel = new JPanel(new BorderLayout());
        JLabel label = new JLabel(message);
        label.setFont(UITheme.bodyFont());
        label.setForeground(fg);
        label.setIconTextGap(10);
        label.setBorder(BorderFactory.createEmptyBorder(14, 18, 14, 18));
        panel.add(label, BorderLayout.CENTER);
        return panel;
    }

    // ---------------------------------------------------------------
    // Time formatting
    // ---------------------------------------------------------------

    private static final DateTimeFormatter TIME = DateTimeFormatter.ofPattern("hh:mm a");
    private static final DateTimeFormatter FULL = DateTimeFormatter.ofPattern("EEEE, MMM d");

    public static String time(LocalDateTime dateTime) {
        return dateTime == null ? "—" : TIME.format(dateTime);
    }

    public static String timeOnly(LocalTime time) {
        return time == null ? "—" : TIME.format(time);
    }

    public static String timeRange(LocalTime start, LocalTime end) {
        return timeOnly(start) + " – " + timeOnly(end);
    }

    public static String fullDate(LocalDateTime dateTime) {
        return dateTime == null ? "—" : FULL.format(dateTime);
    }

    public static String dayTitle(String day) {
        return day == null ? "—" : day.substring(0, 1).toUpperCase() + day.substring(1).toLowerCase();
    }

    // ---------------------------------------------------------------
    // Background work (keeps the EDT responsive)
    // ---------------------------------------------------------------

    /**
     * Runs {@code background} on a worker thread, then executes {@code onDone}
     * on the EDT. Any exception is logged and reported through {@code onError}
     * on the EDT. Never expose a stack trace to the user.
     */
    public static <T> void runAsync(SwingWorkerExecutable<T> background,
                                    Consumer<T> onDone,
                                    Consumer<Throwable> onError) {
        SwingWorker<T, Void> worker = new SwingWorker<T, Void>() {
            @Override
            protected T doInBackground() throws Exception {
                return background.run();
            }

            @Override
            protected void done() {
                try {
                    T result = get();
                    onDone.accept(result);
                } catch (Exception e) {
                    onError.accept(e);
                }
            }
        };
        worker.execute();
    }

    @FunctionalInterface
    public interface SwingWorkerExecutable<T> {
        T run() throws Exception;
    }

    /** Runs a task on the EDT. */
    public static void onEdt(Runnable task) {
        if (SwingUtilities.isEventDispatchThread()) {
            task.run();
        } else {
            SwingUtilities.invokeLater(task);
        }
    }

    public static Window windowOf(Component component) {
        Component c = component;
        while (c != null && !(c instanceof Window)) {
            c = c.getParent();
        }
        return (Window) c;
    }
}
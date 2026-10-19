package com.smartattendance.ui;

import com.smartattendance.model.Faculty;
import com.smartattendance.ui.components.Sidebar;
import com.smartattendance.ui.components.TopBar;

import javax.swing.BorderFactory;
import javax.swing.JFrame;
import javax.swing.JPanel;
import javax.swing.SwingUtilities;
import java.awt.BorderLayout;
import java.awt.CardLayout;
import java.awt.Color;
import java.awt.Dimension;
import java.awt.FlowLayout;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * The single main application window: a persistent sidebar, a top bar with the
 * current page and live sync status, and a card stack of page panels. All page
 * transitions happen inside this window.
 */
public final class MainFrame extends JFrame {

    private final AppContext context;
    private final Sidebar sidebar = new Sidebar(this::navigate);
    private final TopBar topBar = new TopBar();
    private final CardLayout cardLayout = new CardLayout();
    private final JPanel pageStack = new JPanel(cardLayout);
    private final Map<Sidebar.Page, JPanel> pages = new LinkedHashMap<>();

    private Sidebar.Page current = null;

    public MainFrame(AppContext context) {
        this.context = context;
        setTitle("Smart University Attendance Management System");
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        setSize(1280, 800);
        setMinimumSize(new Dimension(1024, 680));
        setLocationRelativeTo(null);

        registerPages();
        buildShell();

        Faculty faculty = context.getCurrentFaculty();
        if (faculty != null) {
            sidebar.setFaculty(faculty.getName(), faculty.getFacultyId());
        }

        context.setOnUiStateChanged(() -> SwingUtilities.invokeLater(this::refreshTopBar));
        refreshTopBar();
        navigate(Sidebar.Page.DASHBOARD);
    }

    private void registerPages() {
        pages.put(Sidebar.Page.DASHBOARD, new DashboardPanel(context, this));
        pages.put(Sidebar.Page.TIMETABLE, new TimetablePanel(context, this));
        pages.put(Sidebar.Page.ATTENDANCE, new AttendancePanel(context));
        pages.put(Sidebar.Page.REPORTS, new ReportsPanel(context));
        pages.put(Sidebar.Page.DELEGATION, new DelegationPanel(context));
        pages.put(Sidebar.Page.DEVICE_SIMULATOR, new DeviceSimulatorPanel(context));
        pages.put(Sidebar.Page.SYSTEM_STATUS, new SystemStatusPanel(context));
    }

    private void buildShell() {
        JPanel root = new JPanel(new BorderLayout());
        root.setBackground(UITheme.BACKGROUND);

        for (Map.Entry<Sidebar.Page, JPanel> entry : pages.entrySet()) {
            pageStack.add(entry.getValue(), entry.getKey().name());
        }

        JPanel center = new JPanel(new BorderLayout());
        center.setBackground(UITheme.BACKGROUND);
        center.add(topBar, BorderLayout.NORTH);
        JPanel wrappedPages = new JPanel(new BorderLayout());
        wrappedPages.setBackground(UITheme.BACKGROUND);
        wrappedPages.setBorder(BorderFactory.createEmptyBorder(10, 10, 10, 10));
        wrappedPages.add(pageStack, BorderLayout.CENTER);
        center.add(wrappedPages, BorderLayout.CENTER);

        root.add(sidebar, BorderLayout.WEST);
        root.add(center, BorderLayout.CENTER);
        root.add(buildStatusStrip(), BorderLayout.SOUTH);

        sidebar.setLogoutAction(this::logout);

        setContentPane(root);
    }

    private JPanel buildStatusStrip() {
        JPanel strip = new JPanel(new FlowLayout(FlowLayout.LEFT, 20, 4));
        strip.setBackground(Color.WHITE);
        strip.setBorder(BorderFactory.createMatteBorder(1, 0, 0, 0, UITheme.BORDER));
        strip.setPreferredSize(new Dimension(0, 30));
        return strip;
    }

    public void navigate(Sidebar.Page page) {
        if (!pages.containsKey(page)) {
            return;
        }
        JPanel previous = current == null ? null : pages.get(current);
        if (previous instanceof RefreshablePanel) {
            ((RefreshablePanel) previous).onHidden();
        }
        current = page;
        sidebar.setActivePage(page);
        topBar.setTitle(page.getTitle());
        cardLayout.show(pageStack, page.name());
        topBar.setFaculty(context.getCurrentFaculty() == null
                ? "" : context.getCurrentFaculty().getFacultyId());
        refreshTopBar();
        JPanel next = pages.get(current);
        if (next instanceof RefreshablePanel) {
            ((RefreshablePanel) next).onShown();
        }
    }

    public void refreshTopBar() {
        long pending = context.pendingSyncCount();
        if (!context.isBackendOnline()) {
            topBar.setSyncChip("OUTBOX · " + pending + " queued", new Color(0xB3, 0x26, 0x1E));
        } else if (pending > 0) {
            topBar.setSyncChip("SYNCING · " + pending + " pending", UITheme.WARNING);
        } else {
            topBar.setSyncChip("SYNCED", UITheme.SUCCESS);
        }
    }

    public void switchToPage(Sidebar.Page page, Runnable before) {
        if (before != null) {
            before.run();
        }
        navigate(page);
    }

    private void logout() {
        context.setActiveSession(null);
        context.setActiveSlot(null);
        context.setCurrentFaculty(null);
        dispose();
        new LoginFrame(context).setVisible(true);
    }
}
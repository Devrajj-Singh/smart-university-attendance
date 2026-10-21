package com.smartattendance.ui.components;

import com.smartattendance.ui.UITheme;

import javax.swing.BorderFactory;
import javax.swing.Box;
import javax.swing.BoxLayout;
import javax.swing.JLabel;
import javax.swing.JPanel;
import java.awt.BorderLayout;
import java.awt.Color;
import java.awt.Component;
import java.awt.Cursor;
import java.awt.Dimension;
import java.awt.FlowLayout;
import java.awt.Font;
import java.awt.GridLayout;
import java.awt.event.MouseAdapter;
import java.awt.event.MouseEvent;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Persistent left-hand navigation. Single selection model; the active page is
 * highlighted. Navigation always stays inside the main frame (no new windows).
 */
public class Sidebar extends JPanel {

    public enum Page {
        DASHBOARD("Dashboard", "⌂"),
        TIMETABLE("Timetable", "▤"),
        ATTENDANCE("Attendance", "✓"),
        REPORTS("Reports", "▦"),
        DELEGATION("Delegation", "⇄"),
        DEVICE_SIMULATOR("Device Simulator", "⟳"),
        SYSTEM_STATUS("System Status", "⚙");

        private final String title;
        private final String glyph;

        Page(String title, String glyph) {
            this.title = title;
            this.glyph = glyph;
        }

        public String getTitle() {
            return title;
        }

        public String getGlyph() {
            return glyph;
        }
    }

    private final Map<Page, NavItem> navItems = new HashMap<>();
    private final PageListener listener;
    private final JLabel facultyChip = new JLabel();
    private final JLabel logoutAction = new JLabel("Sign Out");

    private Page activePage;

    @FunctionalInterface
    public interface PageListener {
        void onNavigate(Page page);
    }

    public Sidebar(PageListener listener) {
        this.listener = listener;
        setBackground(UITheme.SIDEBAR_BG);
        setLayout(new BorderLayout());

        JPanel contents = new JPanel();
        contents.setLayout(new BoxLayout(contents, BoxLayout.Y_AXIS));
        contents.setOpaque(false);

        contents.add(buildBrand());
        contents.add(verticalGap(14));
        contents.add(buildNavPanel());
        contents.add(Box.createVerticalGlue());
        contents.add(verticalGap(10));
        contents.add(buildFooter());

        add(contents, BorderLayout.CENTER);
        setPreferredSize(new Dimension(228, 0));
    }

    private Component buildBrand() {
        JPanel brand = new JPanel(new BorderLayout(0, 2));
        brand.setOpaque(false);
        brand.setBorder(BorderFactory.createEmptyBorder(20, 18, 8, 18));

        JLabel name = new JLabel("Smart University");
        name.setFont(UITheme.font(Font.BOLD, 15));
        name.setForeground(Color.WHITE);

        JLabel subtitle = new JLabel("Attendance Management");
        subtitle.setFont(UITheme.font(Font.PLAIN, 11));
        subtitle.setForeground(UITheme.TEXT_ON_DARK_MUTED);

        brand.add(name, BorderLayout.NORTH);
        brand.add(subtitle, BorderLayout.SOUTH);
        return brand;
    }

    private Component buildNavPanel() {
        JPanel nav = new JPanel(new GridLayout(0, 1, 0, 2));
        nav.setOpaque(false);
        nav.setBorder(BorderFactory.createEmptyBorder(0, 10, 4, 10));

        Page[] primary = {
            Page.DASHBOARD, Page.TIMETABLE, Page.ATTENDANCE,
            Page.REPORTS, Page.DELEGATION, Page.DEVICE_SIMULATOR
        };
        for (Page page : primary) {
            nav.add(buildNavItem(page));
            nav.add(verticalGap(2));
        }
        nav.add(verticalGap(6));

        JLabel sectionLabel = new JLabel("SYSTEM");
        sectionLabel.setFont(UITheme.font(Font.BOLD, 10));
        sectionLabel.setForeground(UITheme.TEXT_ON_DARK_MUTED);
        sectionLabel.setBorder(BorderFactory.createEmptyBorder(8, 4, 2, 4));
        nav.add(sectionLabel);

        for (Page page : new Page[] { Page.SYSTEM_STATUS }) {
            nav.add(buildNavItem(page));
        }
        return nav;
    }

    private Component buildNavItem(Page page) {
        NavItem item = new NavItem(page);
        navItems.put(page, item);
        item.addMouseListener(new MouseAdapter() {
            @Override
            public void mousePressed(MouseEvent e) {
                setActivePage(page);
                if (listener != null) {
                    listener.onNavigate(page);
                }
            }
        });
        return item;
    }

    private Component buildFooter() {
        JPanel footer = new JPanel();
        footer.setLayout(new BoxLayout(footer, BoxLayout.Y_AXIS));
        footer.setOpaque(false);
        footer.setBorder(BorderFactory.createEmptyBorder(10, 14, 16, 14));

        facultyChip.setFont(UITheme.font(Font.BOLD, 12));
        facultyChip.setForeground(Color.WHITE);
        facultyChip.setAlignmentX(Component.LEFT_ALIGNMENT);

        JLabel role = new JLabel("Faculty");
        role.setFont(UITheme.font(Font.PLAIN, 11));
        role.setForeground(UITheme.TEXT_ON_DARK_MUTED);
        role.setAlignmentX(Component.LEFT_ALIGNMENT);

        JPanel chip = new JPanel(new FlowLayout(FlowLayout.LEFT, 0, 0));
        chip.setOpaque(false);
        chip.setBorder(BorderFactory.createEmptyBorder(10, 12, 10, 12));

        JLabel icon = new JLabel("●");
        icon.setFont(UITheme.font(Font.PLAIN, 11));
        icon.setForeground(UITheme.SUCCESS);
        icon.setBorder(BorderFactory.createEmptyBorder(0, 0, 0, 8));

        JPanel text = new JPanel();
        text.setLayout(new BoxLayout(text, BoxLayout.Y_AXIS));
        text.setOpaque(false);
        text.add(facultyChip);
        text.add(role);

        chip.add(icon);
        chip.add(text);

        JPanel container = new JPanel(new BorderLayout());
        container.setOpaque(false);
        container.add(chip, BorderLayout.CENTER);
        container.setBorder(BorderFactory.createMatteBorder(1, 0, 0, 0, new java.awt.Color(0x2A, 0x38, 0x4D)));
        footer.add(container);

        logoutAction.setFont(UITheme.secondaryFont());
        logoutAction.setForeground(UITheme.TEXT_ON_DARK_MUTED);
        logoutAction.setAlignmentX(Component.LEFT_ALIGNMENT);
        logoutAction.setBorder(BorderFactory.createEmptyBorder(8, 14, 4, 14));
        logoutAction.setCursor(Cursor.getPredefinedCursor(Cursor.HAND_CURSOR));
        footer.add(logoutAction);
        return footer;
    }

    public void setFaculty(String name, String facultyId) {
        if (name != null && !name.isEmpty()) {
            facultyChip.setText(name + " · " + facultyId);
        } else {
            facultyChip.setText(facultyId == null ? "Not signed in" : facultyId);
        }
    }

    public void setLogoutAction(Runnable action) {
        logoutAction.addMouseListener(new MouseAdapter() {
            @Override
            public void mousePressed(MouseEvent e) {
                if (action != null) {
                    action.run();
                }
            }
        });
    }

    public void setActivePage(Page page) {
        if (page == null) {
            return;
        }
        activePage = page;
        for (Map.Entry<Page, NavItem> entry : navItems.entrySet()) {
            entry.getValue().setActive(entry.getKey() == page);
        }
    }

    public Page getActivePage() {
        return activePage;
    }

    private static Component verticalGap(int height) {
        return Box.createVerticalStrut(height);
    }

    private static class NavItem extends JPanel {
        private final Page page;
        private final JLabel label;
        private boolean active = false;

        NavItem(Page page) {
            super(new BorderLayout(0, 0));
            this.page = page;
            setOpaque(false);
            setBorder(BorderFactory.createEmptyBorder(9, 12, 9, 12));

            JLabel glyph = new JLabel(page.getGlyph());
            glyph.setFont(UITheme.font(Font.PLAIN, 14));
            glyph.setForeground(UITheme.TEXT_ON_DARK_MUTED);
            glyph.setBorder(BorderFactory.createEmptyBorder(0, 0, 0, 10));

            label = new JLabel(page.getTitle());
            label.setFont(UITheme.font(Font.PLAIN, 13));
            label.setForeground(UITheme.TEXT_ON_DARK);

            add(glyph, BorderLayout.WEST);
            add(label, BorderLayout.CENTER);

            setCursor(Cursor.getPredefinedCursor(Cursor.HAND_CURSOR));

            addMouseListener(new MouseAdapter() {
                @Override
                public void mouseEntered(MouseEvent e) {
                    if (!active) {
                        setBackground(UITheme.SIDEBAR_HOVER);
                        label.setForeground(Color.WHITE);
                        glyph.setForeground(Color.WHITE);
                    }
                }

                @Override
                public void mouseExited(MouseEvent e) {
                    if (!active) {
                        setBackground(UITheme.SIDEBAR_BG);
                        label.setForeground(UITheme.TEXT_ON_DARK);
                        glyph.setForeground(UITheme.TEXT_ON_DARK_MUTED);
                    }
                }
            });
        }

        void setActive(boolean active) {
            this.active = active;
            if (active) {
                setBackground(UITheme.SIDEBAR_ACTIVE);
                label.setForeground(Color.WHITE);
                label.setFont(UITheme.font(Font.BOLD, 13));
            } else {
                setBackground(UITheme.SIDEBAR_BG);
                label.setForeground(UITheme.TEXT_ON_DARK);
                label.setFont(UITheme.font(Font.PLAIN, 13));
            }
            repaint();
        }

        Page getPage() {
            return page;
        }
    }
}
package com.smartattendance.ui.components;

import com.smartattendance.ui.UITheme;

import javax.swing.BorderFactory;
import javax.swing.Box;
import javax.swing.BoxLayout;
import javax.swing.JLabel;
import javax.swing.JPanel;
import java.awt.BorderLayout;
import java.awt.Color;
import java.awt.FlowLayout;
import java.awt.Font;

/**
 * Top bar with the current page title on the left and system status on the
 * right. The status chip reflects the live synchronization state.
 */
public class TopBar extends JPanel {

    private final JLabel titleLabel = new JLabel();
    private final JLabel syncChip = new JLabel();
    private final JLabel facultyLabel = new JLabel();

    public TopBar() {
        setBackground(Color.WHITE);
        setLayout(new BorderLayout());
        setBorder(BorderFactory.createMatteBorder(0, 0, 1, 0, new Color(0xE3, 0xE7, 0xED)));

        titleLabel.setFont(UITheme.font(Font.BOLD, 18));
        titleLabel.setForeground(UITheme.TEXT);
        titleLabel.setBorder(BorderFactory.createEmptyBorder(0, 0, 0, 4));

        facultyLabel.setFont(UITheme.font(Font.PLAIN, 12));
        facultyLabel.setForeground(UITheme.TEXT_MUTED);
        facultyLabel.setBorder(BorderFactory.createEmptyBorder(0, 12, 0, 4));

        JPanel left = new JPanel(new FlowLayout(FlowLayout.LEFT, 8, 0));
        left.setOpaque(false);
        left.setBorder(BorderFactory.createEmptyBorder(18, 30, 18, 10));
        left.add(titleLabel);
        left.add(facultyLabel);

        JPanel right = new JPanel(new FlowLayout(FlowLayout.RIGHT, 10, 0));
        right.setOpaque(false);
        right.setBorder(BorderFactory.createEmptyBorder(18, 10, 18, 30));
        JPanel rightPanel = new JPanel();
        rightPanel.setLayout(new BoxLayout(rightPanel, BoxLayout.X_AXIS));
        rightPanel.setOpaque(false);
        rightPanel.add(syncChip);
        right.add(rightPanel);

        add(left, BorderLayout.WEST);
        add(right, BorderLayout.EAST);
    }

    public void setTitle(String title) {
        titleLabel.setText(title);
    }

    public void setFaculty(String text) {
        facultyLabel.setText(text);
    }

    public void setSyncChip(String text, Color color) {
        syncChip.setText(text);
        syncChip.setFont(UITheme.font(Font.BOLD, 11));
        syncChip.setForeground(Color.WHITE);
        syncChip.setBackground(color);
        syncChip.setOpaque(true);
        syncChip.setBorder(BorderFactory.createEmptyBorder(6, 12, 6, 12));
    }
}
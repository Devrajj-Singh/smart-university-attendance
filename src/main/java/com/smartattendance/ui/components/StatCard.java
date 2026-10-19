package com.smartattendance.ui.components;

import com.smartattendance.ui.UITheme;

import javax.swing.BorderFactory;
import javax.swing.JLabel;
import javax.swing.JPanel;
import java.awt.BorderLayout;
import java.awt.FlowLayout;
import java.awt.Font;

/**
 * Dashboard statistic card: a large value, a caption, and an icon glyph.
 * Used for "Today's Classes", "Attendance Sessions", "Students Marked",
 * "Pending Sync", and report summaries.
 */
public class StatCard extends StyledCardPanel {

    private final JLabel valueLabel;
    private final JLabel captionLabel;
    private final JLabel iconLabel;

    public StatCard(String iconGlyph, String caption) {
        super(new BorderLayout(0, 10), UITheme.CORNER, UITheme.SURFACE, UITheme.BORDER);
        setBorder(BorderFactory.createEmptyBorder(18, 20, 18, 20));

        iconLabel = new JLabel(iconGlyph);
        iconLabel.setFont(UITheme.font(Font.PLAIN, 22));
        iconLabel.setForeground(UITheme.ACCENT);

        valueLabel = new JLabel("0");
        valueLabel.setFont(UITheme.font(Font.BOLD, 30));
        valueLabel.setForeground(UITheme.TEXT);

        captionLabel = new JLabel(caption);
        captionLabel.setFont(UITheme.secondaryFont());
        captionLabel.setForeground(UITheme.TEXT_SECONDARY);

        JPanel row = new JPanel(new FlowLayout(FlowLayout.LEFT, 0, 0));
        row.setOpaque(false);

        JPanel textColumn = new JPanel(new BorderLayout(0, 2));
        textColumn.setOpaque(false);
        textColumn.add(valueLabel, BorderLayout.NORTH);
        textColumn.add(captionLabel, BorderLayout.CENTER);

        add(iconLabel, BorderLayout.WEST);
        add(textColumn, BorderLayout.CENTER);
    }

    public void setValue(String value) {
        valueLabel.setText(value);
    }

    public void setCaption(String caption) {
        captionLabel.setText(caption);
    }

    public void setAccent(java.awt.Color color) {
        iconLabel.setForeground(color);
    }
}
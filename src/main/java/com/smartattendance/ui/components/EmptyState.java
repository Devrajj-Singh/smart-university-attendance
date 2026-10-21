package com.smartattendance.ui.components;

import com.smartattendance.ui.UITheme;

import javax.swing.BorderFactory;
import javax.swing.JLabel;
import javax.swing.SwingConstants;
import java.awt.Font;
import java.awt.GridBagConstraints;
import java.awt.GridBagLayout;
import java.awt.Insets;

/**
 * Full-width empty state for tables and lists ("No classes scheduled today",
 * "No records yet", ...). Replaces bare "no data" tables with a friendly card.
 */
public class EmptyState extends StyledCardPanel {

    public EmptyState(String headline, String caption) {
        super(new GridBagLayout(), UITheme.CORNER, UITheme.SURFACE, UITheme.BORDER);
        setBorder(BorderFactory.createEmptyBorder(42, 24, 42, 24));

        GridBagConstraints gc = new GridBagConstraints();
        gc.gridx = 0;
        gc.gridy = 0;
        gc.insets = new Insets(4, 20, 4, 20);

        JLabel icon = new JLabel("◌");
        icon.setFont(UITheme.font(Font.BOLD, 36));
        icon.setForeground(UITheme.TEXT_MUTED);
        icon.setHorizontalAlignment(SwingConstants.CENTER);
        gc.gridwidth = GridBagConstraints.REMAINDER;
        add(icon, gc);

        gc.gridy = 1;
        JLabel head = new JLabel(headline);
        head.setFont(UITheme.bodyStrongFont());
        head.setForeground(UITheme.TEXT);
        head.setHorizontalAlignment(SwingConstants.CENTER);
        add(head, gc);

        if (caption != null && !caption.isEmpty()) {
            gc.gridy = 2;
            JLabel cap = new JLabel(caption);
            cap.setFont(UITheme.secondaryFont());
            cap.setForeground(UITheme.TEXT_SECONDARY);
            cap.setHorizontalAlignment(SwingConstants.CENTER);
            add(cap, gc);
        }
    }

    public EmptyState(String headline) {
        this(headline, null);
    }
}
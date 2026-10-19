package com.smartattendance.ui.components;

import com.smartattendance.ui.UITheme;

import javax.swing.BorderFactory;
import javax.swing.JLabel;
import javax.swing.SwingConstants;
import java.awt.Color;
import java.awt.Font;
import java.awt.Graphics;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.Shape;
import java.awt.geom.RoundRectangle2D;

/**
 * A small pill-shaped status label with a leading glyph so status is never
 * communicated by color alone (accessibility). e.g. "✓ PRESENT".
 */
public class StatusBadge extends JLabel {

    private final Color bg;
    private final Color fg;

    public StatusBadge(String text, Color bg, Color fg) {
        super(text);
        this.bg = bg;
        this.fg = fg;
        setOpaque(false);
        setHorizontalAlignment(SwingConstants.CENTER);
        setFont(UITheme.font(Font.BOLD, UITheme.FONT_SMALL));
        setForeground(fg);
        setBorder(BorderFactory.createEmptyBorder(4, 12, 4, 12));
    }

    @Override
    protected void paintComponent(Graphics g) {
        Graphics2D g2 = (Graphics2D) g.create();
        g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        int w = getWidth() - 1;
        int h = getHeight() - 1;
        Shape shape = new RoundRectangle2D.Float(0, 0, w, h, 12, 12);
        g2.setColor(bg);
        g2.fill(shape);
        g2.dispose();
        super.paintComponent(g);
    }
}
package com.smartattendance.ui.components;

import com.smartattendance.ui.UITheme;

import javax.swing.JButton;
import java.awt.Color;
import java.awt.Cursor;
import java.awt.Graphics;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.Shape;
import java.awt.event.MouseAdapter;
import java.awt.event.MouseEvent;
import java.awt.geom.RoundRectangle2D;

/**
 * Consistent rounded action button used across the application. Supports a
 * filled "primary" look and an outlined "secondary" look with a hover state.
 */
public class RoundedButton extends JButton {

    private final int arc;
    private Color fill;
    private Color hover;
    private Color edge;
    private Color textColor;

    public RoundedButton(String text) {
        this(text, UITheme.ACCENT, UITheme.ACCENT_LIGHT, Color.WHITE, UITheme.ACCENT);
    }

    public RoundedButton(String text, Color fill, Color hover, Color textColor, Color edge) {
        super(text);
        this.arc = UITheme.CORNER;
        this.fill = fill;
        this.hover = hover;
        this.textColor = textColor;
        this.edge = edge;
        setFont(UITheme.bodyStrongFont());
        setContentAreaFilled(false);
        setOpaque(false);
        setFocusPainted(false);
        setBorderPainted(false);
        setForeground(textColor);
        setCursor(Cursor.getPredefinedCursor(Cursor.HAND_CURSOR));
        setBorder(javax.swing.BorderFactory.createEmptyBorder(9, 16, 9, 16));
        setRolloverEnabled(true);
        addMouseListener(new MouseAdapter() {
            @Override
            public void mouseEntered(MouseEvent e) {
                setActiveHover(true);
            }

            @Override
            public void mouseExited(MouseEvent e) {
                setActiveHover(false);
            }
        });
    }

    private void setActiveHover(boolean active) {
        if (active) {
            setForeground(textColor.darker());
        } else {
            setForeground(textColor);
        }
        repaint();
    }

    @Override
    protected void paintComponent(Graphics g) {
        Graphics2D g2 = (Graphics2D) g.create();
        g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        int w = getWidth() - 1;
        int h = getHeight() - 1;
        Shape shape = new RoundRectangle2D.Float(0, 0, w, h, arc, arc);
        boolean over = getModel().isRollover();
        g2.setColor(over ? hover : fill);
        g2.fill(shape);
        if (edge != null) {
            g2.setColor(edge);
            g2.draw(shape);
        }
        g2.dispose();
        super.paintComponent(g);
    }
}
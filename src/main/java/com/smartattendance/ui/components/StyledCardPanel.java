package com.smartattendance.ui.components;

import com.smartattendance.ui.UITheme;

import javax.swing.JPanel;
import java.awt.Color;
import java.awt.Graphics;
import java.awt.Graphics2D;
import java.awt.LayoutManager;
import java.awt.RenderingHints;
import java.awt.Shape;
import java.awt.geom.RoundRectangle2D;

/**
 * A rounded, white card surface used across the dashboard. Provides the
 * consistent "card" look without repeating painting logic in every panel.
 */
public class StyledCardPanel extends JPanel {

    private int arc;
    private Color fill;
    private Color edge;

    public StyledCardPanel(LayoutManager layout) {
        this(layout, UITheme.CORNER, UITheme.SURFACE, UITheme.BORDER);
    }

    public StyledCardPanel(LayoutManager layout, int arc, Color fill, Color edge) {
        super(layout);
        this.arc = arc;
        this.fill = fill;
        this.edge = edge;
        setOpaque(false);
        setBackground(fill);
    }

    public void setFill(Color fill) {
        this.fill = fill;
        setBackground(fill);
        repaint();
    }

    public void setEdgeColor(Color edge) {
        this.edge = edge;
        repaint();
    }

    @Override
    protected void paintComponent(Graphics g) {
        Graphics2D g2 = (Graphics2D) g.create();
        g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        int w = getWidth() - 1;
        int h = getHeight() - 1;
        Shape shape = new RoundRectangle2D.Float(0, 0, w, h, arc, arc);
        g2.setColor(fill);
        g2.fill(shape);
        if (edge != null) {
            g2.setColor(edge);
            g2.draw(shape);
        }
        g2.dispose();
    }
}
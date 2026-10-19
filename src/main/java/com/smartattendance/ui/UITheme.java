package com.smartattendance.ui;

import java.awt.Color;
import java.awt.Font;

/**
 * Centralized design system for the desktop UI: colors, typography scale,
 * and spacing. Every panel derives its look from this theme so the whole
 * application stays visually consistent.
 */
public final class UITheme {

    private UITheme() {
    }

    // ---------------------------------------------------------------
    // Brand
    // ---------------------------------------------------------------
    public static final Color PRIMARY = new Color(0x22, 0x37, 0x5B);
    public static final Color PRIMARY_HOVER = new Color(0x1A, 0x2B, 0x47);
    public static final Color PRIMARY_LIGHT = new Color(0xE8, 0xED, 0xF5);
    public static final Color ACCENT = new Color(0x2F, 0x6F, 0xED);
    public static final Color ACCENT_LIGHT = new Color(0xE8, 0xF0, 0xFC);

    // ---------------------------------------------------------------
    // Surfaces & borders
    // ---------------------------------------------------------------
    public static final Color BACKGROUND = new Color(0xF2, 0xF4, 0xF8);
    public static final Color SURFACE = Color.WHITE;
    public static final Color SURFACE_MUTED = new Color(0xF7, 0xF9, 0xFC);
    public static final Color BORDER = new Color(0xE1, 0xE5, 0xEC);

    // ---------------------------------------------------------------
    // Sidebar / dark surfaces
    // ---------------------------------------------------------------
    public static final Color SIDEBAR_BG = new Color(0x14, 0x1F, 0x33);
    public static final Color SIDEBAR_HOVER = new Color(0x1E, 0x2C, 0x44);
    public static final Color SIDEBAR_ACTIVE = new Color(0x2F, 0x6F, 0xED);

    // ---------------------------------------------------------------
    // Text
    // ---------------------------------------------------------------
    public static final Color TEXT = new Color(0x1A, 0x23, 0x32);
    public static final Color TEXT_SECONDARY = new Color(0x5A, 0x6A, 0x7D);
    public static final Color TEXT_MUTED = new Color(0x95, 0x9F, 0xAE);
    public static final Color TEXT_ON_DARK = new Color(0xE8, 0xEC, 0xF3);
    public static final Color TEXT_ON_DARK_MUTED = new Color(0x93, 0xA1, 0xB5);

    // ---------------------------------------------------------------
    // Status colors (used only for success / warning / error / info)
    // ---------------------------------------------------------------
    public static final Color SUCCESS = new Color(0x1B, 0x7A, 0x44);
    public static final Color SUCCESS_BG = new Color(0xE6, 0xF3, 0xEB);
    public static final Color WARNING = new Color(0x9A, 0x66, 0x00);
    public static final Color WARNING_BG = new Color(0xFB, 0xF2, 0xDD);
    public static final Color ERROR = new Color(0xB3, 0x26, 0x1E);
    public static final Color ERROR_BG = new Color(0xFB, 0xE8, 0xE6);
    public static final Color INFO = new Color(0x1A, 0x5F, 0xB4);
    public static final Color INFO_BG = new Color(0xE8, 0xF0, 0xFB);

    // ---------------------------------------------------------------
    // Typography
    // ---------------------------------------------------------------
    public static final int FONT_TITLE = 24;
    public static final int FONT_PAGE_TITLE = 21;
    public static final int FONT_SECTION = 15;
    public static final int FONT_BODY = 13;
    public static final int FONT_SECONDARY = 12;
    public static final int FONT_SMALL = 11;

    public static final int PAD = 18;
    public static final int GAP = 10;
    public static final int CORNER = 14;

    private static final String FAMILY = resolveFamily();

    private static String resolveFamily() {
        for (String candidate : new String[] { "Segoe UI", "Arial", "SansSerif" }) {
            Font probe = new Font(candidate, Font.PLAIN, 12);
            if (probe.getFamily().equalsIgnoreCase(candidate)) {
                return candidate;
            }
        }
        return "SansSerif";
    }

    public static Font font(int style, int size) {
        return new Font(FAMILY, style, size);
    }

    public static Font titleFont() {
        return font(Font.BOLD, FONT_TITLE);
    }

    public static Font pageTitleFont() {
        return font(Font.BOLD, FONT_PAGE_TITLE);
    }

    public static Font sectionTitleFont() {
        return font(Font.BOLD, FONT_SECTION);
    }

    public static Font bodyFont() {
        return font(Font.PLAIN, FONT_BODY);
    }

    public static Font bodyStrongFont() {
        return font(Font.BOLD, FONT_BODY);
    }

    public static Font secondaryFont() {
        return font(Font.PLAIN, FONT_SECONDARY);
    }

    public static Font smallFont() {
        return font(Font.PLAIN, FONT_SMALL);
    }

    public static Font monoFont() {
        return font(Font.PLAIN, FONT_BODY);
    }
}
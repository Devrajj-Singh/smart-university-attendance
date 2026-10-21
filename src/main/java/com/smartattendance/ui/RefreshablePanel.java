package com.smartattendance.ui;

/**
 * Implemented by page panels that want to refresh their content when they
 * become visible (and optionally release state when hidden). The main frame
 * calls these methods during navigation.
 */
public interface RefreshablePanel {

    default void onShown() {
    }

    default void onHidden() {
    }
}
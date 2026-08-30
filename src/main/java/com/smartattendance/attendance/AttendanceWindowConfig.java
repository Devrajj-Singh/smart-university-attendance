package com.smartattendance.attendance;

/**
 * Configurable attendance window, relative to a session's scheduled start time.
 *
 * Example with the default config, for a 10:00-11:00 class:
 *   09:55            -> attendance opens   (openBeforeMinutes = 5)
 *   10:00 - 10:05     -> marked PRESENT     (onTimeMinutes = 5)
 *   10:05 - 10:15     -> marked LATE        (lateMinutes = 15)
 *   10:15 onward       -> attendance closed
 */
public class AttendanceWindowConfig {

    private final int openBeforeMinutes;
    private final int onTimeMinutes;
    private final int lateMinutes;

    public AttendanceWindowConfig(int openBeforeMinutes, int onTimeMinutes, int lateMinutes) {
        if (openBeforeMinutes < 0 || onTimeMinutes < 0 || lateMinutes < 0) {
            throw new IllegalArgumentException("Window minutes cannot be negative");
        }
        if (lateMinutes < onTimeMinutes) {
            throw new IllegalArgumentException("lateMinutes must be >= onTimeMinutes");
        }
        this.openBeforeMinutes = openBeforeMinutes;
        this.onTimeMinutes = onTimeMinutes;
        this.lateMinutes = lateMinutes;
    }

    /** Sensible default: opens 5 min early, on-time for 5 min, late window until 15 min. */
    public static AttendanceWindowConfig defaultConfig() {
        return new AttendanceWindowConfig(5, 5, 15);
    }

    public int getOpenBeforeMinutes() { return openBeforeMinutes; }
    public int getOnTimeMinutes() { return onTimeMinutes; }
    public int getLateMinutes() { return lateMinutes; }
}

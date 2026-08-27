package com.smartattendance.model;

import java.time.LocalDateTime;

/**
 * A single audit trail entry - who did what, to which entity, and when.
 * Used for admin accountability/reporting.
 */
public class AuditLog {

    private String logId;
    private String actorId;
    private String action;
    private String entityType;
    private String entityId;
    private LocalDateTime timestamp;
    private String details;

    public AuditLog(String logId, String actorId, String action, String entityType,
                     String entityId, LocalDateTime timestamp, String details) {
        this.logId = logId;
        this.actorId = actorId;
        this.action = action;
        this.entityType = entityType;
        this.entityId = entityId;
        this.timestamp = timestamp;
        this.details = details;
    }

    public String getLogId() {
        return logId;
    }

    public String getActorId() {
        return actorId;
    }

    public String getAction() {
        return action;
    }

    public String getEntityType() {
        return entityType;
    }

    public String getEntityId() {
        return entityId;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public String getDetails() {
        return details;
    }
}

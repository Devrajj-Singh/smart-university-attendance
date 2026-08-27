package com.smartattendance.database;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.Statement;

/**
 * Single point of access to the SQLite connection.
 *
 * Usage from any other module:
 *
 *     DatabaseManager db = DatabaseManager.getInstance();
 *     db.initializeSchema();          // safe to call every startup
 *     Connection conn = db.getConnection();
 *
 * Repositories in this package already do this internally, so most
 * other modules only ever need the repository classes, not this one
 * directly.
 */
public class DatabaseManager {

    private static final String DB_URL = "jdbc:sqlite:database/smart_attendance.db";

    private static DatabaseManager instance;
    private final Connection connection;

    private DatabaseManager() {
        try {
            // Loading the driver class explicitly keeps this working even
            // on older JVMs/build setups that don't do service-loader auto
            // registration reliably.
            Class.forName("org.sqlite.JDBC");
            connection = DriverManager.getConnection(DB_URL);
            try (Statement stmt = connection.createStatement()) {
                stmt.execute("PRAGMA foreign_keys = ON;");
            }
        } catch (ClassNotFoundException e) {
            throw new RuntimeException(
                "SQLite JDBC driver not found on classpath. " +
                "Add the org.xerial:sqlite-jdbc dependency (see pom.xml).", e);
        } catch (SQLException e) {
            throw new RuntimeException("Failed to connect to database: " + e.getMessage(), e);
        }
    }

    public static synchronized DatabaseManager getInstance() {
        if (instance == null) {
            instance = new DatabaseManager();
        }
        return instance;
    }

    public Connection getConnection() {
        return connection;
    }

    /** Creates every table if it doesn't already exist. Safe to call repeatedly. */
    public void initializeSchema() {
        try (Statement stmt = connection.createStatement()) {
            for (String sql : SchemaDefinition.getStatements()) {
                stmt.execute(sql);
            }
        } catch (SQLException e) {
            throw new RuntimeException("Failed to initialize schema: " + e.getMessage(), e);
        }
    }

    public void close() {
        try {
            if (connection != null && !connection.isClosed()) {
                connection.close();
            }
        } catch (SQLException e) {
            System.err.println("Error closing database connection: " + e.getMessage());
        }
    }
}

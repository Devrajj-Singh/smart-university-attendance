package com.smartattendance.database;

/**
 * Holds every CREATE TABLE statement for the app in one place, so the
 * whole schema is easy to review/version. DatabaseManager executes
 * these when initializeSchema() is called (they use IF NOT EXISTS,
 * so calling it multiple times is safe).
 */
final class SchemaDefinition {

    private SchemaDefinition() {
    }

    static String[] getStatements() {
        return new String[] {

            "CREATE TABLE IF NOT EXISTS class_sections (" +
                "class_id TEXT PRIMARY KEY," +
                "class_name TEXT NOT NULL," +
                "department TEXT," +
                "year INTEGER" +
            ");",

            "CREATE TABLE IF NOT EXISTS classrooms (" +
                "classroom_id TEXT PRIMARY KEY," +
                "room_number TEXT NOT NULL," +
                "building TEXT," +
                "capacity INTEGER" +
            ");",

            "CREATE TABLE IF NOT EXISTS subjects (" +
                "subject_id TEXT PRIMARY KEY," +
                "subject_name TEXT NOT NULL," +
                "subject_code TEXT UNIQUE," +
                "credit_hours INTEGER" +
            ");",

            "CREATE TABLE IF NOT EXISTS students (" +
                "user_id TEXT PRIMARY KEY," +
                "name TEXT NOT NULL," +
                "email TEXT," +
                "card_id TEXT UNIQUE," +
                "biometric_id TEXT UNIQUE," +
                "class_id TEXT," +
                "FOREIGN KEY (class_id) REFERENCES class_sections(class_id)" +
            ");",

            "CREATE TABLE IF NOT EXISTS faculty (" +
                "user_id TEXT PRIMARY KEY," +
                "name TEXT NOT NULL," +
                "email TEXT," +
                "employee_code TEXT UNIQUE," +
                "department TEXT" +
            ");",

            "CREATE TABLE IF NOT EXISTS faculty_subjects (" +
                "faculty_id TEXT NOT NULL," +
                "subject_id TEXT NOT NULL," +
                "PRIMARY KEY (faculty_id, subject_id)," +
                "FOREIGN KEY (faculty_id) REFERENCES faculty(user_id)," +
                "FOREIGN KEY (subject_id) REFERENCES subjects(subject_id)" +
            ");",

            "CREATE TABLE IF NOT EXISTS admins (" +
                "user_id TEXT PRIMARY KEY," +
                "name TEXT NOT NULL," +
                "email TEXT," +
                "access_level TEXT" +
            ");",

            "CREATE TABLE IF NOT EXISTS timetable (" +
                "timetable_id TEXT PRIMARY KEY," +
                "subject_id TEXT," +
                "class_id TEXT," +
                "faculty_id TEXT," +
                "classroom_id TEXT," +
                "day_of_week TEXT," +
                "start_time TEXT," +
                "end_time TEXT," +
                "FOREIGN KEY (subject_id) REFERENCES subjects(subject_id)," +
                "FOREIGN KEY (class_id) REFERENCES class_sections(class_id)," +
                "FOREIGN KEY (faculty_id) REFERENCES faculty(user_id)," +
                "FOREIGN KEY (classroom_id) REFERENCES classrooms(classroom_id)" +
            ");",

            "CREATE TABLE IF NOT EXISTS attendance_sessions (" +
                "session_id TEXT PRIMARY KEY," +
                "subject_id TEXT," +
                "class_id TEXT," +
                "classroom_id TEXT," +
                "scheduled_faculty_id TEXT," +
                "actual_faculty_id TEXT," +
                "start_time TEXT," +
                "end_time TEXT," +
                "status TEXT," +
                "FOREIGN KEY (subject_id) REFERENCES subjects(subject_id)," +
                "FOREIGN KEY (class_id) REFERENCES class_sections(class_id)," +
                "FOREIGN KEY (classroom_id) REFERENCES classrooms(classroom_id)," +
                "FOREIGN KEY (scheduled_faculty_id) REFERENCES faculty(user_id)," +
                "FOREIGN KEY (actual_faculty_id) REFERENCES faculty(user_id)" +
            ");",

            "CREATE TABLE IF NOT EXISTS attendance_records (" +
                "record_id TEXT PRIMARY KEY," +
                "session_id TEXT," +
                "student_id TEXT," +
                "timestamp TEXT," +
                "method TEXT," +
                "status TEXT," +
                "synced INTEGER," +
                "FOREIGN KEY (session_id) REFERENCES attendance_sessions(session_id)," +
                "FOREIGN KEY (student_id) REFERENCES students(user_id)" +
            ");",

            "CREATE TABLE IF NOT EXISTS faculty_delegations (" +
                "delegation_id TEXT PRIMARY KEY," +
                "timetable_id TEXT," +
                "original_faculty_id TEXT," +
                "substitute_faculty_id TEXT," +
                "date TEXT," +
                "reason TEXT," +
                "approved INTEGER," +
                "FOREIGN KEY (timetable_id) REFERENCES timetable(timetable_id)," +
                "FOREIGN KEY (original_faculty_id) REFERENCES faculty(user_id)," +
                "FOREIGN KEY (substitute_faculty_id) REFERENCES faculty(user_id)" +
            ");",

            "CREATE TABLE IF NOT EXISTS biometric_devices (" +
                "device_id TEXT PRIMARY KEY," +
                "classroom_id TEXT," +
                "device_type TEXT," +
                "status TEXT," +
                "last_sync_time TEXT," +
                "FOREIGN KEY (classroom_id) REFERENCES classrooms(classroom_id)" +
            ");",

            "CREATE TABLE IF NOT EXISTS audit_logs (" +
                "log_id TEXT PRIMARY KEY," +
                "actor_id TEXT," +
                "action TEXT," +
                "entity_type TEXT," +
                "entity_id TEXT," +
                "timestamp TEXT," +
                "details TEXT" +
            ");"
        };
    }
}

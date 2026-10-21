-- Smart University Attendance Management System
-- PostgreSQL Database Initialization & Seed Script

-- 1. Class Sections
CREATE TABLE IF NOT EXISTS class_sections (
    class_id VARCHAR(50) PRIMARY KEY,
    class_name VARCHAR(100) NOT NULL,
    department VARCHAR(100),
    year INTEGER
);

-- 2. Classrooms
CREATE TABLE IF NOT EXISTS classrooms (
    classroom_id VARCHAR(50) PRIMARY KEY,
    room_number VARCHAR(50) NOT NULL,
    building VARCHAR(100),
    capacity INTEGER
);

-- 3. Subjects
CREATE TABLE IF NOT EXISTS subjects (
    subject_id VARCHAR(50) PRIMARY KEY,
    subject_name VARCHAR(150) NOT NULL,
    subject_code VARCHAR(50) UNIQUE,
    credit_hours INTEGER
);

-- 4. Faculty
CREATE TABLE IF NOT EXISTS faculty (
    user_id VARCHAR(50) PRIMARY KEY,
    login_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE,
    employee_code VARCHAR(50) UNIQUE,
    department VARCHAR(100),
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'FACULTY',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Faculty Subjects Mapping
CREATE TABLE IF NOT EXISTS faculty_subjects (
    faculty_id VARCHAR(50) REFERENCES faculty(user_id) ON DELETE CASCADE,
    subject_id VARCHAR(50) REFERENCES subjects(subject_id) ON DELETE CASCADE,
    PRIMARY KEY (faculty_id, subject_id)
);

-- 6. Admins
CREATE TABLE IF NOT EXISTS admins (
    user_id VARCHAR(50) PRIMARY KEY,
    login_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE,
    access_level VARCHAR(50) DEFAULT 'SUPER_ADMIN',
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'ADMIN',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Students (Registration Numbers 25215101 to 25215165)
CREATE TABLE IF NOT EXISTS students (
    user_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150),
    card_id VARCHAR(100) UNIQUE,
    biometric_id VARCHAR(100) UNIQUE,
    class_id VARCHAR(50) REFERENCES class_sections(class_id)
);

-- 8. Timetable
CREATE TABLE IF NOT EXISTS timetable (
    timetable_id VARCHAR(50) PRIMARY KEY,
    subject_id VARCHAR(50) REFERENCES subjects(subject_id),
    class_id VARCHAR(50) REFERENCES class_sections(class_id),
    faculty_id VARCHAR(50) REFERENCES faculty(user_id),
    classroom_id VARCHAR(50) REFERENCES classrooms(classroom_id),
    day_of_week VARCHAR(20) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL
);

-- 9. Attendance Sessions
CREATE TABLE IF NOT EXISTS attendance_sessions (
    session_id VARCHAR(100) PRIMARY KEY,
    subject_id VARCHAR(50) REFERENCES subjects(subject_id),
    class_id VARCHAR(50) REFERENCES class_sections(class_id),
    classroom_id VARCHAR(50) REFERENCES classrooms(classroom_id),
    scheduled_faculty_id VARCHAR(50) REFERENCES faculty(user_id),
    actual_faculty_id VARCHAR(50) REFERENCES faculty(user_id),
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    session_type VARCHAR(50) DEFAULT 'AUTOMATIC',
    pairing_token VARCHAR(100),
    window_override BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. Attendance Records
CREATE TABLE IF NOT EXISTS attendance_records (
    record_id VARCHAR(100) PRIMARY KEY,
    session_id VARCHAR(100) REFERENCES attendance_sessions(session_id) ON DELETE CASCADE,
    student_id VARCHAR(50) REFERENCES students(user_id),
    timestamp TIMESTAMP NOT NULL,
    method VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    synced BOOLEAN DEFAULT FALSE,
    device_id VARCHAR(100),
    UNIQUE (session_id, student_id)
);

-- 11. Faculty Delegations
CREATE TABLE IF NOT EXISTS faculty_delegations (
    delegation_id VARCHAR(100) PRIMARY KEY,
    timetable_id VARCHAR(50) REFERENCES timetable(timetable_id),
    session_id VARCHAR(100),
    original_faculty_id VARCHAR(50) REFERENCES faculty(user_id),
    substitute_faculty_id VARCHAR(50) REFERENCES faculty(user_id),
    date DATE NOT NULL,
    reason TEXT,
    status VARCHAR(50) DEFAULT 'PENDING',
    approved_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 12. Biometric Devices
CREATE TABLE IF NOT EXISTS biometric_devices (
    device_id VARCHAR(100) PRIMARY KEY,
    classroom_id VARCHAR(50) REFERENCES classrooms(classroom_id),
    device_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'ONLINE',
    last_sync_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 13. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    log_id VARCHAR(100) PRIMARY KEY,
    actor_id VARCHAR(50) NOT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100),
    entity_id VARCHAR(100),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    details TEXT
);

-- 14. Security Violations
CREATE TABLE IF NOT EXISTS security_violations (
    violation_id VARCHAR(100) PRIMARY KEY,
    session_id VARCHAR(100) REFERENCES attendance_sessions(session_id) ON DELETE CASCADE,
    student_id VARCHAR(50) REFERENCES students(user_id) ON DELETE CASCADE,
    device_fingerprint VARCHAR(150),
    violation_type VARCHAR(100) NOT NULL,
    details TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cleared_by_faculty BOOLEAN DEFAULT FALSE,
    cleared_by VARCHAR(50) REFERENCES faculty(user_id),
    cleared_at TIMESTAMP
);

-- 15. Session Device Bindings (Strict 1-Device-to-1-Student Scoped Per Session)
CREATE TABLE IF NOT EXISTS session_device_bindings (
    binding_id VARCHAR(100) PRIMARY KEY,
    session_id VARCHAR(100) REFERENCES attendance_sessions(session_id) ON DELETE CASCADE,
    device_fingerprint VARCHAR(150) NOT NULL,
    student_id VARCHAR(50) REFERENCES students(user_id) ON DELETE CASCADE,
    ip_address VARCHAR(100),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_session_device UNIQUE (session_id, device_fingerprint)
);

-- SEED DATA

-- Class Sections
INSERT INTO class_sections (class_id, class_name, department, year) VALUES
('CLS001', 'CSE-A', 'Computer Science & Engineering', 2),
('CLS002', 'CSE-B', 'Computer Science & Engineering', 2)
ON CONFLICT (class_id) DO NOTHING;

-- Classrooms
INSERT INTO classrooms (classroom_id, room_number, building, capacity) VALUES
('ROOM001', '101', 'Main Academic Block', 60),
('ROOM002', '102', 'Main Academic Block', 60),
('ROOM003', '201', 'Computing Annex', 45)
ON CONFLICT (classroom_id) DO NOTHING;

-- Subjects
INSERT INTO subjects (subject_id, subject_name, subject_code, credit_hours) VALUES
('SUB001', 'Data Structures & Algorithms', 'CS201', 4),
('SUB002', 'Database Management Systems', 'CS202', 4),
('SUB003', 'Operating Systems', 'CS203', 4)
ON CONFLICT (subject_id) DO NOTHING;

-- Faculty (Password: 'faculty123' bcrypt hash: $2b$10$jWdbXbgPi1EPTGIZpCYKeuG83tmbDfiInZc2eNdiowm4z.stRS8dq)
INSERT INTO faculty (user_id, login_id, name, email, employee_code, department, password_hash, role) VALUES
('FAC001', 'F001', 'Dr. Anita Rao', 'anita.rao@university.edu', 'EMP1001', 'Computer Science', '$2b$10$jWdbXbgPi1EPTGIZpCYKeuG83tmbDfiInZc2eNdiowm4z.stRS8dq', 'FACULTY'),
('FAC002', 'F002', 'Prof. Sanjay Mehta', 'sanjay.mehta@university.edu', 'EMP1002', 'Computer Science', '$2b$10$jWdbXbgPi1EPTGIZpCYKeuG83tmbDfiInZc2eNdiowm4z.stRS8dq', 'FACULTY'),
('FAC003', 'F003', 'Dr. Priya Nair', 'priya.nair@university.edu', 'EMP1003', 'Computer Science', '$2b$10$jWdbXbgPi1EPTGIZpCYKeuG83tmbDfiInZc2eNdiowm4z.stRS8dq', 'FACULTY'),
('FAC004', 'F004', 'Prof. Meera Singh', 'meera.singh@university.edu', 'EMP1004', 'Computer Science', '$2b$10$jWdbXbgPi1EPTGIZpCYKeuG83tmbDfiInZc2eNdiowm4z.stRS8dq', 'FACULTY')
ON CONFLICT (user_id) DO UPDATE SET password_hash = EXCLUDED.password_hash, login_id = EXCLUDED.login_id;

-- Faculty Subjects
INSERT INTO faculty_subjects (faculty_id, subject_id) VALUES
('FAC001', 'SUB001'),
('FAC002', 'SUB002'),
('FAC003', 'SUB001'),
('FAC004', 'SUB003')
ON CONFLICT DO NOTHING;

-- Admins (Password: 'admin123' bcrypt hash: $2b$10$VP6XcXYx0JPdwPry0.Sai.6/tUpkuqocpRKRsM4XyG6Ge7ykv5vdq)
INSERT INTO admins (user_id, login_id, name, email, access_level, password_hash, role) VALUES
('ADM001', 'ADM001', 'Academic Dean Office', 'dean.academics@university.edu', 'SUPER_ADMIN', '$2b$10$VP6XcXYx0JPdwPry0.Sai.6/tUpkuqocpRKRsM4XyG6Ge7ykv5vdq', 'ADMIN')
ON CONFLICT (user_id) DO UPDATE SET password_hash = EXCLUDED.password_hash, login_id = EXCLUDED.login_id;

-- Timetable
INSERT INTO timetable (timetable_id, subject_id, class_id, faculty_id, classroom_id, day_of_week, start_time, end_time) VALUES
('TT001', 'SUB001', 'CLS001', 'FAC001', 'ROOM001', 'MONDAY', '09:00:00', '10:00:00'),
('TT002', 'SUB002', 'CLS001', 'FAC002', 'ROOM002', 'MONDAY', '10:15:00', '11:15:00'),
('TT003', 'SUB001', 'CLS002', 'FAC003', 'ROOM003', 'TUESDAY', '09:00:00', '10:00:00'),
('TT004', 'SUB002', 'CLS002', 'FAC002', 'ROOM001', 'TUESDAY', '10:15:00', '11:15:00'),
('TT005', 'SUB003', 'CLS001', 'FAC004', 'ROOM002', 'WEDNESDAY', '09:00:00', '10:00:00'),
('TT006', 'SUB001', 'CLS001', 'FAC001', 'ROOM001', 'THURSDAY', '11:30:00', '12:30:00'),
('TT007', 'SUB002', 'CLS002', 'FAC002', 'ROOM003', 'FRIDAY', '09:00:00', '10:00:00')
ON CONFLICT (timetable_id) DO NOTHING;

-- Devices
INSERT INTO biometric_devices (device_id, classroom_id, device_type, status) VALUES
('DEV-ROOM001', 'ROOM001', 'RFID_AND_IRIS', 'ONLINE'),
('DEV-ROOM002', 'ROOM002', 'RFID_AND_IRIS', 'ONLINE'),
('DEV-ROOM003', 'ROOM003', 'RFID_AND_IRIS', 'ONLINE')
ON CONFLICT (device_id) DO NOTHING;

-- 65 Students Generation (25215101 to 25215165)
DO $$
DECLARE
    i INTEGER;
    reg_num VARCHAR(50);
    s_name VARCHAR(150);
    c_id VARCHAR(50);
    names TEXT[] := ARRAY[
        'Aarav Sharma', 'Vivaan Gupta', 'Aditya Singh', 'Diya Patel', 'Ananya Reddy',
        'Ishaan Verma', 'Saanvi Iyer', 'Rohan Kulkarni', 'Sneha Deshmukh', 'Devansh Malhotra',
        'Priya Nambiar', 'Vikramaditya Rao', 'Tanya Kapoor', 'Rahul Chatterjee', 'Aditi Sen',
        'Kabir Mehta', 'Ishita Choudhury', 'Siddharth Bhat', 'Riya Bhattacharya', 'Ayush Saxena',
        'Pooja Nair', 'Nikhil Agarwal', 'Meera Menon', 'Shreyas Joshi', 'Divya Pillai',
        'Harsh Vardhan', 'Neha Pandey', 'Kunal Tiwari', 'Kavya Trivedi', 'Pranav Mukherjee',
        'Shruti Mishra', 'Gaurav Dubey', 'Lavanya Sundaram', 'Tarun Bajaj', 'Simran Kaur',
        'Aryan Khanna', 'Natasha Bose', 'Ritvik Das', 'Tanvi Hegde', 'Varun Ranganathan',
        'Pallavi Goswami', 'Yash Singhal', 'Deepa Venkatesh', 'Mohit Oberoi', 'Swati Sethi',
        'Armaan Sheikh', 'Kritika Rawat', 'Samarth Kaushik', 'Rashmi Soni', 'Akshat Jain',
        'Chetna Bansal', 'Dhruv Solanki', 'Mansi Chauhan', 'Parth Jindal', 'Vidya Krishnan',
        'Chirag Somani', 'Shalini Yadav', 'Alok Srivastava', 'Anjali Thapar', 'Bhavya Nayak',
        'Udit Mathur', 'Garima Shukla', 'Rishabh Chawla', 'Mallika Dasgupta', 'Tejas Sheth'
    ];
BEGIN
    FOR i IN 0..64 LOOP
        reg_num := CAST(25215101 + i AS VARCHAR);
        s_name := names[i + 1];
        IF i < 35 THEN
            c_id := 'CLS001';
        ELSE
            c_id := 'CLS002';
        END IF;

        INSERT INTO students (user_id, name, email, card_id, biometric_id, class_id)
        VALUES (
            reg_num,
            s_name,
            LOWER(REPLACE(s_name, ' ', '.')) || '@university.edu',
            'CARD-' || reg_num,
            'IRIS-' || reg_num,
            c_id
        ) ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email;
    END LOOP;
END $$;

-- 14. Past Semester Attendance Sessions
INSERT INTO attendance_sessions (session_id, subject_id, class_id, classroom_id, scheduled_faculty_id, actual_faculty_id, start_time, end_time, status, session_type) VALUES
('PAST-SES-001', 'SUB001', 'CLS001', 'ROOM001', 'FAC001', 'FAC001', '2026-09-02 09:00:00', '2026-09-02 10:00:00', 'CLOSED', 'AUTOMATIC'),
('PAST-SES-002', 'SUB002', 'CLS001', 'ROOM002', 'FAC002', 'FAC002', '2026-09-04 10:15:00', '2026-09-04 11:15:00', 'CLOSED', 'AUTOMATIC'),
('PAST-SES-003', 'SUB003', 'CLS001', 'ROOM003', 'FAC004', 'FAC004', '2026-09-09 09:00:00', '2026-09-09 10:00:00', 'CLOSED', 'AUTOMATIC'),
('PAST-SES-004', 'SUB001', 'CLS001', 'ROOM001', 'FAC001', 'FAC001', '2026-09-11 11:30:00', '2026-09-11 12:30:00', 'CLOSED', 'AUTOMATIC'),
('PAST-SES-005', 'SUB002', 'CLS001', 'ROOM002', 'FAC002', 'FAC002', '2026-09-16 10:15:00', '2026-09-16 11:15:00', 'CLOSED', 'AUTOMATIC'),
('PAST-SES-006', 'SUB001', 'CLS001', 'ROOM001', 'FAC001', 'FAC001', '2026-09-18 09:00:00', '2026-09-18 10:00:00', 'CLOSED', 'AUTOMATIC'),
('PAST-SES-007', 'SUB003', 'CLS001', 'ROOM003', 'FAC004', 'FAC004', '2026-09-23 09:00:00', '2026-09-23 10:00:00', 'CLOSED', 'AUTOMATIC'),
('PAST-SES-008', 'SUB001', 'CLS001', 'ROOM001', 'FAC001', 'FAC001', '2026-09-25 11:30:00', '2026-09-25 12:30:00', 'CLOSED', 'AUTOMATIC'),
('PAST-SES-009', 'SUB002', 'CLS001', 'ROOM002', 'FAC002', 'FAC002', '2026-09-30 10:15:00', '2026-09-30 11:15:00', 'CLOSED', 'AUTOMATIC'),
('PAST-SES-010', 'SUB001', 'CLS001', 'ROOM001', 'FAC001', 'FAC001', '2026-10-07 09:00:00', '2026-10-07 10:00:00', 'CLOSED', 'AUTOMATIC'),
('PAST-SES-011', 'SUB001', 'CLS002', 'ROOM003', 'FAC003', 'FAC003', '2026-09-16 09:00:00', '2026-09-16 10:00:00', 'CLOSED', 'AUTOMATIC'),
('PAST-SES-012', 'SUB002', 'CLS002', 'ROOM001', 'FAC002', 'FAC002', '2026-09-18 10:15:00', '2026-09-18 11:15:00', 'CLOSED', 'AUTOMATIC'),
('PAST-SES-013', 'SUB001', 'CLS002', 'ROOM003', 'FAC003', 'FAC003', '2026-09-23 09:00:00', '2026-09-23 10:00:00', 'CLOSED', 'AUTOMATIC'),
('PAST-SES-014', 'SUB002', 'CLS002', 'ROOM001', 'FAC002', 'FAC002', '2026-09-25 10:15:00', '2026-09-25 11:15:00', 'CLOSED', 'AUTOMATIC'),
('PAST-SES-015', 'SUB001', 'CLS002', 'ROOM003', 'FAC003', 'FAC003', '2026-09-30 09:00:00', '2026-09-30 10:00:00', 'CLOSED', 'AUTOMATIC'),
('PAST-SES-016', 'SUB002', 'CLS002', 'ROOM001', 'FAC002', 'FAC002', '2026-10-07 10:15:00', '2026-10-07 11:15:00', 'CLOSED', 'AUTOMATIC')
ON CONFLICT (session_id) DO NOTHING;

-- 15. Realistic Attendance Distribution Records
DO $$
DECLARE
    rec RECORD;
    sess RECORD;
    student_num INTEGER;
    target_rate NUMERIC;
    attendance_status VARCHAR(20);
    v_record_id VARCHAR(100);
    sess_index INTEGER;
    sess_count INTEGER;
    target_count INTEGER;
BEGIN
    FOR rec IN SELECT user_id, class_id FROM students ORDER BY user_id LOOP
        student_num := CAST(RIGHT(rec.user_id, 2) AS INTEGER);

        -- ~6 students in Critical (< 65%)
        -- ~14 students in Warning (65% - 74%)
        -- ~45 students in Eligible (>= 75%)
        IF (student_num % 11 = 0) THEN
            target_rate := 0.55; -- Statutory Critical (< 65%)
        ELSIF (student_num % 4 = 0) THEN
            target_rate := 0.70; -- Warning Zone (65% - 74%)
        ELSE
            target_rate := 0.88; -- Exam Eligible (>= 75%)
        END IF;

        SELECT COUNT(*) INTO sess_count FROM attendance_sessions WHERE class_id = rec.class_id AND status = 'CLOSED';
        target_count := ROUND(sess_count * target_rate);

        sess_index := 0;
        FOR sess IN SELECT session_id, start_time FROM attendance_sessions WHERE class_id = rec.class_id AND status = 'CLOSED' ORDER BY start_time ASC LOOP
            sess_index := sess_index + 1;
            IF sess_index <= target_count THEN
                IF (sess_index % 7 = 0) THEN
                    attendance_status := 'LATE';
                ELSE
                    attendance_status := 'PRESENT';
                END IF;
                v_record_id := 'HIST-' || sess.session_id || '-' || rec.user_id;

                INSERT INTO attendance_records (record_id, session_id, student_id, timestamp, method, status, synced, device_id)
                VALUES (v_record_id, sess.session_id, rec.user_id, sess.start_time, 'CARD', attendance_status, TRUE, 'HISTORICAL_SEED')
                ON CONFLICT (session_id, student_id) DO NOTHING;
            END IF;
        END LOOP;
    END LOOP;
END $$;


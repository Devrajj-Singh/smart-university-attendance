-- Reseed Realistic University Attendance Distribution
-- Ensures:
-- ~45 Exam Eligible (>= 75%)
-- ~14 Warning Zone (65% - 74%)
-- ~6 Statutory Critical (< 65%)

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
    -- Remove old historical records
    DELETE FROM attendance_records WHERE device_id = 'HISTORICAL_SEED' OR attendance_records.record_id LIKE 'HIST-%';

    FOR rec IN SELECT user_id, class_id FROM students ORDER BY user_id LOOP
        student_num := CAST(RIGHT(rec.user_id, 2) AS INTEGER);

        -- Realistic Distribution:
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

        -- Count total sessions for this student's class
        SELECT COUNT(*) INTO sess_count FROM attendance_sessions WHERE class_id = rec.class_id;
        target_count := ROUND(sess_count * target_rate);

        sess_index := 0;
        FOR sess IN SELECT session_id, start_time FROM attendance_sessions WHERE class_id = rec.class_id ORDER BY start_time ASC LOOP
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
                ON CONFLICT (session_id, student_id) 
                DO UPDATE SET status = EXCLUDED.status, method = EXCLUDED.method, synced = TRUE;
            END IF;
        END LOOP;
    END LOOP;
END $$;

-- Normalize delegation statuses: replace ACTIVE with APPROVED
UPDATE faculty_delegations SET status = 'APPROVED' WHERE status = 'ACTIVE';

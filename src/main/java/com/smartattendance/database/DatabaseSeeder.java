package com.smartattendance.database;

import com.smartattendance.database.repository.ClassSectionRepository;
import com.smartattendance.database.repository.ClassroomRepository;
import com.smartattendance.database.repository.FacultyRepository;
import com.smartattendance.database.repository.StudentRepository;
import com.smartattendance.database.repository.SubjectRepository;
import com.smartattendance.database.repository.TimetableRepository;
import com.smartattendance.model.ClassSection;
import com.smartattendance.model.Classroom;
import com.smartattendance.model.Faculty;
import com.smartattendance.model.Student;
import com.smartattendance.model.Subject;
import com.smartattendance.model.Timetable;

import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Statement;
import java.time.DayOfWeek;
import java.time.LocalTime;

/**
 * Fills a freshly-created database with small, realistic-looking
 * dummy data so every teammate has something to run against without
 * needing to write their own test fixtures.
 *
 * Call DatabaseSeeder.seed() once after DatabaseManager.initializeSchema().
 * It checks whether data already exists and skips re-seeding, so it's
 * safe to call on every app startup.
 */
public final class DatabaseSeeder {

    private DatabaseSeeder() {
    }

    public static void seed() {
        Connection connection = DatabaseManager.getInstance().getConnection();
        if (alreadySeeded(connection)) {
            return;
        }

        ClassSectionRepository classSectionRepository = new ClassSectionRepository();
        ClassroomRepository classroomRepository = new ClassroomRepository();
        SubjectRepository subjectRepository = new SubjectRepository();
        FacultyRepository facultyRepository = new FacultyRepository();
        StudentRepository studentRepository = new StudentRepository();
        TimetableRepository timetableRepository = new TimetableRepository();

        // ---- 2 class sections ----
        classSectionRepository.insert(new ClassSection("CLS001", "CSE-A", "Computer Science", 2));
        classSectionRepository.insert(new ClassSection("CLS002", "CSE-B", "Computer Science", 2));

        // ---- 3 classrooms ----
        classroomRepository.insert(new Classroom("ROOM001", "101", "Main Block", 60));
        classroomRepository.insert(new Classroom("ROOM002", "102", "Main Block", 60));
        classroomRepository.insert(new Classroom("ROOM003", "201", "Annex Block", 40));

        // ---- 2 subjects ----
        subjectRepository.insert(new Subject("SUB001", "Data Structures", "CS201", 4));
        subjectRepository.insert(new Subject("SUB002", "Database Systems", "CS202", 4));

        // ---- 3 faculty ----
        Faculty f1 = new Faculty("FAC001", "Dr. Anita Rao", "anita.rao@university.edu", "EMP1001", "Computer Science");
        Faculty f2 = new Faculty("FAC002", "Prof. Sanjay Mehta", "sanjay.mehta@university.edu", "EMP1002", "Computer Science");
        Faculty f3 = new Faculty("FAC003", "Dr. Priya Nair", "priya.nair@university.edu", "EMP1003", "Computer Science");
        f1.assignSubject("SUB001");
        f2.assignSubject("SUB002");
        f3.assignSubject("SUB001");
        facultyRepository.insert(f1);
        facultyRepository.insert(f2);
        facultyRepository.insert(f3);

        // ---- 15 students, split across the two class sections ----
        String[][] studentData = {
            {"Aarav Sharma", "CLS001"}, {"Vivaan Gupta", "CLS001"}, {"Aditya Singh", "CLS001"},
            {"Diya Patel", "CLS001"}, {"Ananya Reddy", "CLS001"}, {"Ishaan Verma", "CLS001"},
            {"Saanvi Iyer", "CLS001"}, {"Kabir Joshi", "CLS002"}, {"Myra Kapoor", "CLS002"},
            {"Arjun Nair", "CLS002"}, {"Aadhya Menon", "CLS002"}, {"Reyansh Bose", "CLS002"},
            {"Kiara Das", "CLS002"}, {"Vihaan Rao", "CLS002"}, {"Anika Chatterjee", "CLS002"}
        };
        for (int i = 0; i < studentData.length; i++) {
            String userId = String.format("STU%03d", i + 1);
            String name = studentData[i][0];
            String classId = studentData[i][1];
            String email = name.toLowerCase().replace(" ", ".") + "@university.edu";
            String cardId = String.format("CARD%04d", 1000 + i);
            String biometricId = String.format("IRIS%04d", 5000 + i);
            studentRepository.insert(new Student(userId, name, email, cardId, biometricId, classId));
        }

        // ---- a handful of timetable entries ----
        timetableRepository.insert(new Timetable("TT001", "SUB001", "CLS001", "FAC001", "ROOM001",
                DayOfWeek.MONDAY, LocalTime.of(9, 0), LocalTime.of(10, 0)));
        timetableRepository.insert(new Timetable("TT002", "SUB002", "CLS001", "FAC002", "ROOM002",
                DayOfWeek.MONDAY, LocalTime.of(10, 15), LocalTime.of(11, 15)));
        timetableRepository.insert(new Timetable("TT003", "SUB001", "CLS002", "FAC003", "ROOM003",
                DayOfWeek.TUESDAY, LocalTime.of(9, 0), LocalTime.of(10, 0)));
        timetableRepository.insert(new Timetable("TT004", "SUB002", "CLS002", "FAC002", "ROOM001",
                DayOfWeek.WEDNESDAY, LocalTime.of(11, 0), LocalTime.of(12, 0)));
        timetableRepository.insert(new Timetable("TT005", "SUB001", "CLS001", "FAC001", "ROOM001",
                DayOfWeek.THURSDAY, LocalTime.of(9, 0), LocalTime.of(10, 0)));

        System.out.println("Dummy data seeded: 15 students, 3 faculty, 2 subjects, 2 classes, 3 classrooms, 5 timetable entries.");
    }

    private static boolean alreadySeeded(Connection connection) {
        try (Statement stmt = connection.createStatement()) {
            var rs = stmt.executeQuery("SELECT COUNT(*) FROM students");
            if (rs.next()) {
                return rs.getInt(1) > 0;
            }
        } catch (SQLException e) {
            // Table probably doesn't exist yet - caller should run initializeSchema() first.
            return false;
        }
        return false;
    }
}

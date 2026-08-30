package com.smartattendance.attendance.testsupport;

import com.smartattendance.database.repository.StudentRepository;
import com.smartattendance.model.Student;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/** Simple in-memory fake used only for tests/demos - NOT the real DB-backed repository. */
public class InMemoryStudentRepository extends StudentRepository {

    private final Map<String, Student> students = new ConcurrentHashMap<>();

    public void add(Student student) {
        students.put(student.getId(), student);
    }

    @Override
    public Student findById(String studentId) {
        return students.get(studentId);
    }

    @Override
    public boolean isEnrolledInClass(String studentId, String classId) {
        Student s = students.get(studentId);
        return s != null && s.getClassId().equals(classId);
    }
}

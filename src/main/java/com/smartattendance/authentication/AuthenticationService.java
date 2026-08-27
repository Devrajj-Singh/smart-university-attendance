package com.smartattendance.authentication;

import com.smartattendance.attendance.AttendanceService;
import com.smartattendance.model.AttendanceSession;
import com.smartattendance.model.BiometricDevice;
import com.smartattendance.model.Student;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

public class AuthenticationService {

    private final AttendanceService attendanceService;
    private final List<AuthenticationResult> history = new ArrayList<>();

    public AuthenticationService(AttendanceService attendanceService) {
        this.attendanceService = attendanceService;
    }

    public AuthenticationResult authenticateStudent(Student student,
                                                      String authenticationInput,
                                                      AuthenticationMethod method,
                                                      BiometricDevice device,
                                                      AttendanceSession session) {

        AuthenticationResult result;
        try {
            result = method.authenticate(student, authenticationInput, device);
        } catch (Exception e) {
            result = new AuthenticationResult(
                    AuthenticationResult.Status.FAILED, student, "Authentication error: " + e.getMessage());
        }

        history.add(result);

        if (result.isSuccessful() && session != null) {
            try {
                attendanceService.recordAttendance(student, session);
            } catch (RuntimeException ex) {
                var failure = new AuthenticationResult(
                        AuthenticationResult.Status.FAILED, student,
                        "Authenticated, but attendance recording failed: " + ex.getMessage());
                history.add(failure);
                return failure;
            }
        }

        return result;
    }

    public AuthenticationResult authenticateStudent(String authenticationInput, AuthenticationMethod method) {
        throw new UnsupportedOperationException(
                "Use the full overload: authenticateStudent(Student, String, AuthenticationMethod, "
                        + "BiometricDevice, AttendanceSession). A Student and device are required "
                        + "to actually perform the check.");
    }

    public boolean isDeviceReady(BiometricDevice device) {
        return device != null && device.isReady();
    }

    public List<AuthenticationResult> getAuthenticationHistory() {
        return Collections.unmodifiableList(history);
    }

    public Optional<AuthenticationResult> getLastAuthenticationResult() {
        if (history.isEmpty()) return Optional.empty();
        return Optional.of(history.get(history.size() - 1));
    }
}

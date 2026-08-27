package com.smartattendance.authentication;

import com.smartattendance.exceptions.AuthenticationException;
import com.smartattendance.model.BiometricDevice;
import com.smartattendance.model.Student;
import java.util.HashMap;
import java.util.Map;

// SIMULATION ONLY — no real iris SDK/hardware. Real implementation would
// call a vendor SDK and compare a match-confidence score against a threshold.
public class IrisAuthentication implements AuthenticationMethod {

    private final Map<String, String> registeredBiometrics = new HashMap<>();

    public IrisAuthentication() {
        registeredBiometrics.put("STU001", "IRIS001"); // dummy data
    }

    public void registerBiometric(String studentId, String biometricId) {
        registeredBiometrics.put(studentId, biometricId);
    }

    @Override
    public AuthenticationResult authenticate(Student student, String capturedBiometricId, BiometricDevice device)
            throws AuthenticationException {

        if (student == null) {
            throw new AuthenticationException("Student reference cannot be null");
        }

        if (device == null || !device.isReady()) {
            return new AuthenticationResult(
                    AuthenticationResult.Status.DEVICE_ERROR, student,
                    "Iris scanner device is offline or unavailable");
        }

        var registeredBiometric = registeredBiometrics.get(student.getStudentId());

        if (registeredBiometric == null) {
            return new AuthenticationResult(
                    AuthenticationResult.Status.UNKNOWN_USER, student,
                    "No iris template is enrolled for student " + student.getStudentId());
        }

        if (capturedBiometricId == null || capturedBiometricId.isBlank()) {
            return new AuthenticationResult(
                    AuthenticationResult.Status.BIOMETRIC_MISMATCH, student,
                    "No iris capture was provided");
        }

        if (!registeredBiometric.equals(capturedBiometricId)) {
            return new AuthenticationResult(
                    AuthenticationResult.Status.BIOMETRIC_MISMATCH, student,
                    "Captured iris template did not match enrolled template");
        }

        return new AuthenticationResult(
                AuthenticationResult.Status.SUCCESS,
                student,
                "Iris match successful");
    }

    @Override
    public String getMethodName() {
        return "IRIS";
    }
}

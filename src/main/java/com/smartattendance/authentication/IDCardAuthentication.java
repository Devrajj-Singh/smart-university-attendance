package com.smartattendance.authentication;

import com.smartattendance.exceptions.AuthenticationException;
import com.smartattendance.model.BiometricDevice;
import com.smartattendance.model.Student;
import java.util.HashMap;
import java.util.Map;

public class IDCardAuthentication implements AuthenticationMethod {

    private final Map<String, String> registeredCards = new HashMap<>();

    public IDCardAuthentication() {
        registeredCards.put("STU001", "CARD001"); // dummy data
    }

    public void registerCard(String studentId, String cardId) {
        registeredCards.put(studentId, cardId);
    }

    @Override
    public AuthenticationResult authenticate(Student student, String scannedCardId, BiometricDevice device)
            throws AuthenticationException {

        if (student == null) {
            throw new AuthenticationException("Student reference cannot be null");
        }

        if (device == null || !device.isReady()) {
            return new AuthenticationResult(
                    AuthenticationResult.Status.DEVICE_ERROR, student,
                    "Card reader device is offline or unavailable");
        }

        var registeredCard = registeredCards.get(student.getStudentId());

        if (registeredCard == null) {
            return new AuthenticationResult(
                    AuthenticationResult.Status.UNKNOWN_USER, student,
                    "No card is registered for student " + student.getStudentId());
        }

        if (scannedCardId == null || scannedCardId.isBlank()) {
            return new AuthenticationResult(
                    AuthenticationResult.Status.INVALID_CARD, student, "No card was scanned");
        }

        if (!registeredCard.equals(scannedCardId)) {
            return new AuthenticationResult(
                    AuthenticationResult.Status.INVALID_CARD, student,
                    "Scanned card '" + scannedCardId + "' does not match student's registered card");
        }

        return new AuthenticationResult(
                AuthenticationResult.Status.SUCCESS, student, "ID card verified successfully");
    }

    @Override
    public String getMethodName() {
        return "ID_CARD";
    }
}

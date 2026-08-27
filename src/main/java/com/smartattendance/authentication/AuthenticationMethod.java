package com.smartattendance.authentication;

import com.smartattendance.exceptions.AuthenticationException;
import com.smartattendance.model.BiometricDevice;
import com.smartattendance.model.Student;

public interface AuthenticationMethod {

    AuthenticationResult authenticate(Student student, String credentialInput, BiometricDevice device)
            throws AuthenticationException;

    String getMethodName();
}

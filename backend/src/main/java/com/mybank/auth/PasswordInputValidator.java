package com.mybank.auth;

import java.nio.charset.StandardCharsets;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class PasswordInputValidator implements ConstraintValidator<ValidPassword, String> {

    public static boolean accepts(String password) {
        return password != null && !password.isBlank()
                && password.getBytes(StandardCharsets.UTF_8).length <= 72;
    }

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        return accepts(value);
    }
}

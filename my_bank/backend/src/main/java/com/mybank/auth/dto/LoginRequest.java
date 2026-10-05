package com.mybank.auth.dto;

import com.mybank.auth.ValidPassword;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.Locale;

public record LoginRequest(
        @NotBlank(message = "Informe seu e-mail.")
        @Email(message = "Informe um e-mail válido.")
        @Size(max = 254, message = "O e-mail deve ter até 254 caracteres.") String email,
        @ValidPassword String password) {
    public LoginRequest {
        if (email != null) email = email.trim().toLowerCase(Locale.ROOT);
    }

    @Override
    public String toString() { return "LoginRequest[password=[REDACTED]]"; }
}

package com.mybank.auth;

import com.mybank.auth.dto.LoginRequest;
import com.mybank.support.AuthTestConfig;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class AuthServiceTest {
    private final AuthenticationManager provider = mock(AuthenticationManager.class);
    private final AuthService service = new AuthService(provider);
    @Test
    void authenticate_whenValid_returnsIdentityWithoutPassword() {
        var identity = UsernamePasswordAuthenticationToken.authenticated(AuthTestConfig.EMAIL, null, java.util.List.of());
        when(provider.authenticate(any())).thenReturn(identity);

        var result = service.authenticate(new LoginRequest(AuthTestConfig.EMAIL, AuthTestConfig.PASSWORD));

        assertThat(result.getName()).isEqualTo(AuthTestConfig.EMAIL);
        assertThat(result.getCredentials()).isNull();
    }
    @Test
    void authenticate_wrongPasswordAndUnknownUser_haveSameDomainFailure() {
        when(provider.authenticate(any())).thenThrow(new BadCredentialsException(UUID.randomUUID().toString()),
                new UsernameNotFoundException(UUID.randomUUID().toString()));

        for (int attempt = 0; attempt < 2; attempt++) {
            assertThatThrownBy(() -> service.authenticate(new LoginRequest(AuthTestConfig.EMAIL, AuthTestConfig.PASSWORD)))
                    .isInstanceOf(InvalidCredentialsException.class).hasMessage("E-mail ou senha inválidos");
        }
    }
    @Test
    void loginRequest_normalizesEmailAndRedactsPassword() {
        var request = new LoginRequest("  " + AuthTestConfig.EMAIL.toUpperCase() + " ", AuthTestConfig.PASSWORD);
        assertThat(request.email()).isEqualTo(AuthTestConfig.EMAIL);
        assertThat(request.password()).isEqualTo(AuthTestConfig.PASSWORD);
        assertThat(request.toString()).doesNotContain(AuthTestConfig.PASSWORD);
    }
    @Test
    void passwordValidation_countsUtf8BytesAndRejectsBlank() {
        assertThat(PasswordInputValidator.accepts("é".repeat(36))).isTrue();
        assertThat(PasswordInputValidator.accepts("é".repeat(37))).isFalse();
        assertThat(PasswordInputValidator.accepts(" ")).isFalse();
        assertThat(PasswordInputValidator.accepts(null)).isFalse();
    }
}

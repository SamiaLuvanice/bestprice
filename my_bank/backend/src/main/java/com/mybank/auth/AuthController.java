package com.mybank.auth;

import com.mybank.auth.dto.LoginRequest;
import com.mybank.auth.dto.UserResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService auth;
    private final SessionAuthentication sessions;
    public AuthController(AuthService auth, SessionAuthentication sessions) {
        this.auth = auth;
        this.sessions = sessions;
    }
    @GetMapping("/csrf")
    ResponseEntity<Void> csrf(CsrfToken token) {
        token.getToken();
        return ResponseEntity.noContent().build();
    }
    @PostMapping("/login")
    UserResponse login(@Valid @RequestBody LoginRequest login, HttpServletRequest request, HttpServletResponse response) {
        var authentication = auth.authenticate(login);
        sessions.login(authentication, request, response);
        return new UserResponse(authentication.getName());
    }
    @GetMapping("/me")
    UserResponse me(Authentication authentication) { return new UserResponse(authentication.getName()); }
    @PostMapping("/logout")
    ResponseEntity<Void> logout(HttpServletRequest request, HttpServletResponse response) {
        sessions.logout(request, response);
        return ResponseEntity.noContent().build();
    }
}

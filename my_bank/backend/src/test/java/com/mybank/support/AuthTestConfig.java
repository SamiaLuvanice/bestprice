package com.mybank.support;

import java.util.UUID;
import org.springframework.test.context.DynamicPropertyRegistry;

public final class AuthTestConfig {
    public static final String EMAIL = "test-" + UUID.randomUUID() + "@example.test";
    public static final String PASSWORD = UUID.randomUUID().toString();
    private AuthTestConfig() {}
    public static void properties(DynamicPropertyRegistry registry) {
        registry.add("bank.auth.email", () -> EMAIL);
        registry.add("bank.auth.password", () -> PASSWORD);
    }
    public static String loginJson() {
        return "{\"email\":\"" + EMAIL + "\",\"password\":\"" + PASSWORD + "\"}";
    }
}

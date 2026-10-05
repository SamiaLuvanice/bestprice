package com.mybank.auth;

import jakarta.validation.Validator;
import com.mybank.auth.dto.LoginRequest;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;

@Configuration(proxyBeanMethods = false)
@EnableConfigurationProperties(LocalAccountProperties.class)
public class LocalAccountConfig {
    @Bean
    PasswordEncoder passwordEncoder() { return new BCryptPasswordEncoder(); }

    @Bean
    InMemoryUserDetailsManager localUsers(LocalAccountProperties properties,
                                         PasswordEncoder encoder, Validator validator) {
        var request = new LoginRequest(properties.getEmail(), properties.getPassword());
        var invalid = validator.validate(request);
        if (!invalid.isEmpty()) {
            String names = invalid.stream().map(v -> v.getPropertyPath().toString())
                    .distinct().sorted().map(p -> "BANK_AUTH_" + p.toUpperCase(java.util.Locale.ROOT))
                    .collect(java.util.stream.Collectors.joining(", "));
            throw new IllegalStateException("Configuração ausente ou inválida: " + names);
        }
        String encoded = encoder.encode(properties.getPassword());
        properties.erasePassword();
        return new InMemoryUserDetailsManager(User.withUsername(properties.getEmail())
                .password(encoded).roles("USER").build());
    }

    @Bean
    AuthenticationManager authenticationManager(InMemoryUserDetailsManager users, PasswordEncoder encoder) {
        var provider = new DaoAuthenticationProvider(users);
        provider.setPasswordEncoder(encoder);
        return new ProviderManager(provider);
    }
}

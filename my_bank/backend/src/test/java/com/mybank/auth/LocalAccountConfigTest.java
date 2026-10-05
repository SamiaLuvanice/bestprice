package com.mybank.auth;

import com.mybank.support.AuthTestConfig;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import static org.assertj.core.api.Assertions.*;

class LocalAccountConfigTest {
    private final ApplicationContextRunner runner = new ApplicationContextRunner()
            .withUserConfiguration(LocalAccountConfig.class)
            .withBean(jakarta.validation.Validator.class, LocalValidatorFactoryBean::new);
    @Test
    void missingConfiguration_failsAndReportsOnlyPropertyNames() {
        runner.run(context -> assertThat(context.getStartupFailure()).hasRootCauseMessage(
                "Configuração ausente ou inválida: BANK_AUTH_EMAIL, BANK_AUTH_PASSWORD"));
        runner.withPropertyValues("bank.auth.email=" + AuthTestConfig.EMAIL).run(context ->
                assertThat(context.getStartupFailure()).hasRootCauseMessage(
                        "Configuração ausente ou inválida: BANK_AUTH_PASSWORD"));
        runner.withPropertyValues("bank.auth.password=" + AuthTestConfig.PASSWORD).run(context -> {
            assertThat(context.getStartupFailure()).hasRootCauseMessage("Configuração ausente ou inválida: BANK_AUTH_EMAIL");
            assertThat(context.getStartupFailure().toString()).doesNotContain(AuthTestConfig.PASSWORD);
        });
    }
    @Test
    void invalidConfiguration_neverEchoesSecret() {
        String rejected = UUID.randomUUID().toString().repeat(3);
        runner.withPropertyValues("bank.auth.email=invalid", "bank.auth.password=" + rejected).run(context -> {
            assertThat(context.getStartupFailure()).hasRootCauseMessage(
                    "Configuração ausente ou inválida: BANK_AUTH_EMAIL, BANK_AUTH_PASSWORD");
            assertThat(context.getStartupFailure().toString()).doesNotContain(rejected);
        });
    }
    @Test
    void sameEnvironment_onRestart_preservesAccountUsingBcryptAndErasesPlaintext() {
        for (int restart = 0; restart < 2; restart++) {
            runner.withPropertyValues("bank.auth.email=" + AuthTestConfig.EMAIL, "bank.auth.password=" + AuthTestConfig.PASSWORD)
                    .run(context -> {
                        assertThat(context).hasNotFailed();
                        var user = context.getBean(InMemoryUserDetailsManager.class).loadUserByUsername(AuthTestConfig.EMAIL);
                        assertThat(user.getPassword()).startsWith("$2");
                        assertThat(context.getBean(PasswordEncoder.class).matches(AuthTestConfig.PASSWORD, user.getPassword())).isTrue();
                        assertThat(context.getBean(LocalAccountProperties.class).getPassword()).isNull();
                        var authentication = context.getBean(AuthenticationManager.class).authenticate(
                                UsernamePasswordAuthenticationToken.unauthenticated(AuthTestConfig.EMAIL, AuthTestConfig.PASSWORD));
                        assertThat(authentication.getCredentials()).isNull();
                    });
        }
    }
}

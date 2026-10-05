package com.mybank.auth;

import com.mybank.shared.error.ApiProblems;
import jakarta.servlet.DispatcherType;
import java.time.Clock;
import java.util.List;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.session.ChangeSessionIdAuthenticationStrategy;
import org.springframework.security.web.authentication.session.CompositeSessionAuthenticationStrategy;
import org.springframework.security.web.authentication.session.SessionAuthenticationStrategy;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.*;
import org.springframework.security.web.savedrequest.NullRequestCache;

@Configuration(proxyBeanMethods = false)
public class SecurityConfig {
    @Bean
    Clock clock() { return Clock.systemUTC(); }
    @Bean
    CookieCsrfTokenRepository csrfRepository() {
        var repository = CookieCsrfTokenRepository.withHttpOnlyFalse();
        repository.setCookieCustomizer(cookie -> cookie.path("/").sameSite("Lax"));
        return repository;
    }
    @Bean
    SecurityContextRepository contextRepository() { return new HttpSessionSecurityContextRepository(); }
    @Bean
    SessionAuthenticationStrategy sessionStrategy(CookieCsrfTokenRepository csrf) {
        return new CompositeSessionAuthenticationStrategy(List.of(
                new ChangeSessionIdAuthenticationStrategy(), new CsrfAuthenticationStrategy(csrf)));
    }
    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http, ApiProblems problems,
            SessionActivityService activity, SecurityContextRepository repository, CookieCsrfTokenRepository csrf)
            throws Exception {
        http.formLogin(AbstractHttpConfigurer::disable).httpBasic(AbstractHttpConfigurer::disable)
                .logout(AbstractHttpConfigurer::disable).rememberMe(AbstractHttpConfigurer::disable)
                .requestCache(cache -> cache.requestCache(new NullRequestCache()))
                .securityContext(context -> context.securityContextRepository(repository).requireExplicitSave(true))
                .csrf(config -> config.spa().csrfTokenRepository(csrf))
                .addFilterBefore(new SessionActivityFilter(activity, problems), CsrfFilter.class)
                .authorizeHttpRequests(access -> access.dispatcherTypeMatchers(DispatcherType.ERROR).permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/auth/csrf", "/actuator/health").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/auth/login").permitAll()
                        .requestMatchers("/api/**").authenticated().anyRequest().denyAll())
                .exceptionHandling(errors -> errors
                        .authenticationEntryPoint((request, response, exception) ->
                                problems.write(request, response, 401, "UNAUTHENTICATED", "Autenticação necessária."))
                        .accessDeniedHandler((request, response, exception) -> {
                            boolean invalidCsrf = exception instanceof CsrfException;
                            problems.write(request, response, 403,
                                    invalidCsrf ? "INVALID_CSRF_TOKEN" : "ACCESS_DENIED",
                                    invalidCsrf ? "Não foi possível validar a solicitação. Tente novamente." : "Acesso não permitido.");
                        }));
        return http.build();
    }
}

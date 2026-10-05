package com.mybank.auth;

import com.mybank.support.AuthTestConfig;
import jakarta.servlet.http.Cookie;
import java.time.Clock;
import java.time.Instant;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import static org.mockito.Mockito.when;
import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthSessionIntegrationTest {
    @Autowired MockMvc mvc;
    @MockitoBean Clock clock;
    private final Instant started = Instant.parse("2026-10-05T12:00:00Z");
    @DynamicPropertySource
    static void credentials(DynamicPropertyRegistry registry) { AuthTestConfig.properties(registry); }
    @BeforeEach
    void initializeClock() { when(clock.instant()).thenReturn(started); }

    Cookie bootstrap() throws Exception {
        return mvc.perform(get("/api/auth/csrf")).andExpect(status().isNoContent())
                .andReturn().getResponse().getCookie("XSRF-TOKEN");
    }
    MockHttpSession login(MockHttpSession previous) throws Exception {
        Cookie token = bootstrap();
        var request = post("/api/auth/login").cookie(token).header("X-XSRF-TOKEN", token.getValue())
                .contentType("application/json").content(AuthTestConfig.loginJson());
        if (previous != null) request.session(previous);
        var result = mvc.perform(request).andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(AuthTestConfig.EMAIL)).andReturn();
        assertThat(result.getResponse().getContentAsString()).doesNotContain(AuthTestConfig.PASSWORD, "$2");
        return (MockHttpSession) result.getRequest().getSession(false);
    }
    @Test
    void loginMeLogout_oldSessionCannotAuthenticateAgain() throws Exception {
        var session = login(null);
        String oldId = session.getId();
        mvc.perform(get("/api/auth/me").session(session)).andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(AuthTestConfig.EMAIL));
        Cookie token = bootstrap();
        mvc.perform(post("/api/auth/logout").session(session).cookie(token).header("X-XSRF-TOKEN", token.getValue()))
                .andExpect(status().isNoContent()).andExpect(cookie().maxAge("JSESSIONID", 0));

        assertThat(session.isInvalid()).isTrue();
        mvc.perform(get("/api/auth/me").cookie(new Cookie("JSESSIONID", oldId)).with(request -> {
            request.setRequestedSessionId(oldId); return request;
        })).andExpect(status().isUnauthorized()).andExpect(jsonPath("$.code").value("SESSION_EXPIRED"));
        assertThat(bootstrap().getValue()).isNotBlank();
    }
    @Test
    void authentication_rotatesPreexistingSessionIdAndCsrf() throws Exception {
        var oldSession = new MockHttpSession();
        String oldId = oldSession.getId();
        Cookie oldToken = bootstrap();
        var result = mvc.perform(post("/api/auth/login").session(oldSession).cookie(oldToken)
                        .header("X-XSRF-TOKEN", oldToken.getValue()).contentType("application/json")
                        .content(AuthTestConfig.loginJson())).andExpect(status().isOk()).andReturn();
        assertThat(result.getRequest().getSession(false).getId()).isNotEqualTo(oldId);
        assertThat(result.getResponse().getCookie("XSRF-TOKEN").getMaxAge()).isZero();
        assertThat(bootstrap().getValue()).isNotEqualTo(oldToken.getValue());
    }
    @Test
    void exactIdleBoundary_expiresBeforeCsrfAndPublicRequestsDoNotRenew() throws Exception {
        var session = login(null);
        when(clock.instant()).thenReturn(started.plusSeconds(1799));
        mvc.perform(get("/actuator/health").session(session)).andExpect(status().isOk());
        mvc.perform(get("/api/auth/csrf").session(session)).andExpect(status().isNoContent());
        mvc.perform(post("/api/auth/logout").session(session)).andExpect(status().isForbidden());
        assertThat(session.getAttribute(SessionAuthentication.LAST_ACTIVITY)).isEqualTo(started);
        when(clock.instant()).thenReturn(started.plusSeconds(1800));

        mvc.perform(post("/api/auth/logout").session(session)).andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("SESSION_EXPIRED"));
        assertThat(session.isInvalid()).isTrue();
    }
    @Test
    void acceptedMe_renewsIdleDeadline() throws Exception {
        var session = login(null);
        when(clock.instant()).thenReturn(started.plusMillis(1_799_999));
        mvc.perform(get("/api/auth/me").session(session)).andExpect(status().isOk());
        when(clock.instant()).thenReturn(started.plusSeconds(1800));

        mvc.perform(get("/api/auth/me").session(session)).andExpect(status().isOk());
        assertThat(session.getAttribute(SessionAuthentication.LAST_ACTIVITY)).isEqualTo(started.plusSeconds(1800));
    }
    @Test
    void invalidCredentials_areIdenticalAndProtectedUnknownRoute_isJson() throws Exception {
        Cookie token = bootstrap();
        String wrong = java.util.UUID.randomUUID().toString();
        String first = mvc.perform(post("/api/auth/login").cookie(token).header("X-XSRF-TOKEN", token.getValue())
                        .contentType("application/json").content("{\"email\":\"" + AuthTestConfig.EMAIL + "\",\"password\":\"" + wrong + "\"}"))
                .andExpect(status().isUnauthorized()).andReturn().getResponse().getContentAsString();
        String second = mvc.perform(post("/api/auth/login").cookie(token).header("X-XSRF-TOKEN", token.getValue())
                        .contentType("application/json").content("{\"email\":\"unknown@example.test\",\"password\":\"" + wrong + "\"}"))
                .andExpect(status().isUnauthorized()).andReturn().getResponse().getContentAsString();
        assertThat(second).isEqualTo(first);
        mvc.perform(get("/api/nada")).andExpect(status().isUnauthorized()).andExpect(header().doesNotExist("Location"));
        mvc.perform(get("/api/nada").session(login(null))).andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("NOT_FOUND"));
    }
}

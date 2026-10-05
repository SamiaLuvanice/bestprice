package com.mybank.auth;

import com.mybank.shared.error.ApiProblems;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class SessionActivityFilterTest {
    @Test
    void logoutDuringProtectedRequest_doesNotRecreateInvalidatedSession() throws Exception {
        var instant = Instant.parse("2026-10-05T12:00:00Z");
        var filter = new SessionActivityFilter(new SessionActivityService(Clock.fixed(instant, ZoneOffset.UTC)), mock(ApiProblems.class));
        var session = new MockHttpSession();
        session.setAttribute(SessionAuthentication.LAST_ACTIVITY, instant);
        var request = new MockHttpServletRequest("GET", "/api/auth/me");
        request.setSession(session);
        var response = new MockHttpServletResponse();
        SecurityContextHolder.getContext().setAuthentication(
                UsernamePasswordAuthenticationToken.authenticated("user@example.test", null, List.of()));
        try {
            filter.doFilter(request, response, (incoming, outgoing) -> {
                session.invalidate();
                SecurityContextHolder.clearContext();
                response.setStatus(200);
            });

            assertThat(session.isInvalid()).isTrue();
            assertThat(request.getSession(false)).isNull();
            assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        } finally {
            SecurityContextHolder.clearContext();
        }
    }
}

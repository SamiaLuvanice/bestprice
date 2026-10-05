package com.mybank.auth;

import com.mybank.shared.error.ApiProblems;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.Instant;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

public class SessionActivityFilter extends OncePerRequestFilter {
    private final SessionActivityService activity;
    private final ApiProblems problems;
    public SessionActivityFilter(SessionActivityService activity, ApiProblems problems) {
        this.activity = activity;
        this.problems = problems;
    }
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        String path = request.getRequestURI();
        boolean publicRoute = (request.getMethod().equals("GET") &&
                (path.equals("/api/auth/csrf") || path.equals("/actuator/health"))) ||
                (request.getMethod().equals("POST") && path.equals("/api/auth/login"));
        if (path.startsWith("/api/auth/")) response.setHeader("Cache-Control", "no-store");
        if (publicRoute || !path.startsWith("/api/")) { chain.doFilter(request, response); return; }
        var session = request.getSession(false);
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        Instant previous = null;
        try {
            if (session != null) previous = (Instant) session.getAttribute(SessionAuthentication.LAST_ACTIVITY);
            if (session == null || authentication == null || !authentication.isAuthenticated()
                    || activity.hasExpired(previous)) {
                if (session != null) session.invalidate();
                SecurityContextHolder.clearContext();
                boolean expired = session != null || request.getRequestedSessionId() != null;
                problems.write(request, response, 401, expired ? "SESSION_EXPIRED" : "UNAUTHENTICATED",
                        expired ? "Sua sessão expirou. Entre novamente" : "Autenticação necessária.");
                return;
            }
        } catch (IllegalStateException invalidated) {
            SecurityContextHolder.clearContext();
            problems.write(request, response, 401, "SESSION_EXPIRED", "Sua sessão expirou. Entre novamente");
            return;
        }
        chain.doFilter(request, response);
        if (response.getStatus() >= 200 && response.getStatus() < 300) {
            try {
                synchronized (session) {
                    Instant latest = (Instant) session.getAttribute(SessionAuthentication.LAST_ACTIVITY);
                    session.setAttribute(SessionAuthentication.LAST_ACTIVITY, activity.renew(latest, activity.now()));
                }
            } catch (IllegalStateException invalidated) {
                // Logout concorrente já invalidou: nunca criar outra sessão para renovar atividade.
            }
        }
    }
}

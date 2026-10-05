package com.mybank.auth;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.session.SessionAuthenticationStrategy;
import org.springframework.security.web.authentication.logout.CookieClearingLogoutHandler;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CsrfLogoutHandler;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.stereotype.Component;

@Component
public class SessionAuthentication {
    public static final String LAST_ACTIVITY = SessionAuthentication.class.getName() + ".lastActivity";
    private final SessionAuthenticationStrategy strategy;
    private final SecurityContextRepository repository;
    private final SessionActivityService activity;
    private final CookieCsrfTokenRepository csrf;
    public SessionAuthentication(SessionAuthenticationStrategy strategy, SecurityContextRepository repository,
                                 SessionActivityService activity, CookieCsrfTokenRepository csrf) {
        this.strategy = strategy;
        this.repository = repository;
        this.activity = activity;
        this.csrf = csrf;
    }
    public void login(Authentication authentication, HttpServletRequest request, HttpServletResponse response) {
        strategy.onAuthentication(authentication, request, response);
        var context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);
        repository.saveContext(context, request, response);
        request.getSession(false).setAttribute(LAST_ACTIVITY, activity.now());
    }
    public void logout(HttpServletRequest request, HttpServletResponse response) {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        new SecurityContextLogoutHandler().logout(request, response, authentication);
        new CsrfLogoutHandler(csrf).logout(request, response, authentication);
        new CookieClearingLogoutHandler("JSESSIONID").logout(request, response, authentication);
    }
}

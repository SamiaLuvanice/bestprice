package com.mybank.auth;

import com.mybank.shared.error.ApiProblems;
import com.mybank.shared.error.GlobalExceptionHandler;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AuthController.class)
@Import({SecurityConfig.class, SessionActivityService.class, ApiProblems.class, GlobalExceptionHandler.class})
class AuthControllerTest {
    @Autowired MockMvc mvc;
    @MockitoBean AuthService auth;
    @MockitoBean SessionAuthentication sessions;
    @MockitoBean org.springframework.security.core.userdetails.UserDetailsService users;

    private org.springframework.test.web.servlet.request.RequestPostProcessor validCsrf() {
        return request -> {
            String token = java.util.UUID.randomUUID().toString();
            request.setCookies(new jakarta.servlet.http.Cookie("XSRF-TOKEN", token));
            request.addHeader("X-XSRF-TOKEN", token);
            return request;
        };
    }

    @Test
    void invalidFields_return400WithoutSessionOrAuthentication() throws Exception {
        for (String json : java.util.List.of("{}", "{\"email\":\"invalid\",\"password\":\" \"}",
                "{\"email\":null,\"password\":null}",
                "{\"email\":\"valid@example.test\",\"password\":\"" + "é".repeat(37) + "\"}")) {
            var result = mvc.perform(post("/api/auth/login").with(validCsrf())
                            .contentType("application/json").content(json))
                    .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                    .andExpect(jsonPath("$.errors").isArray()).andReturn();
            assertThat(result.getRequest().getSession(false)).isNull();
        }
        verifyNoInteractions(auth, sessions);
    }
    @Test
    void malformedUnknownAndMissingBody_returnGeneric400() throws Exception {
        for (String json : java.util.List.of("{", "", "{\"email\":\"valid@example.test\",\"password\":\"x\",\"extra\":true}")) {
            mvc.perform(post("/api/auth/login").with(validCsrf()).contentType("application/json").content(json))
                    .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("INVALID_REQUEST"))
                    .andExpect(jsonPath("$.detail").value("Requisição inválida."));
        }
        verifyNoInteractions(auth);
    }
    @Test
    void invalidCredentials_returnStableProblemWithoutSecret() throws Exception {
        when(auth.authenticate(any())).thenThrow(new InvalidCredentialsException());
        mvc.perform(post("/api/auth/login").with(validCsrf()).contentType("application/json")
                        .content(com.mybank.support.AuthTestConfig.loginJson()))
                .andExpect(status().isUnauthorized()).andExpect(content().contentTypeCompatibleWith("application/problem+json"))
                .andExpect(jsonPath("$.title").value("Não autenticado"))
                .andExpect(jsonPath("$.type").value("about:blank"))
                .andExpect(jsonPath("$.instance").value("/api/auth/login"))
                .andExpect(jsonPath("$.code").value("INVALID_CREDENTIALS"));
    }
    @Test
    void loginWithoutCsrf_returns403AndLogoutWithoutSession_returns401First() throws Exception {
        mvc.perform(post("/api/auth/login")).andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("INVALID_CSRF_TOKEN"));
        mvc.perform(post("/api/auth/logout")).andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHENTICATED"));
        verifyNoInteractions(auth, sessions);
    }
    @Test
    void bootstrapCsrf_isPublicAndCreatesCookieWithoutHttpSession() throws Exception {
        var result = mvc.perform(get("/api/auth/csrf")).andExpect(status().isNoContent())
                .andExpect(cookie().exists("XSRF-TOKEN")).andExpect(header().string("Cache-Control", "no-store"))
                .andReturn();
        assertThat(result.getRequest().getSession(false)).isNull();
    }
    @Test
    void unexpectedErrorAndUnsupportedMedia_areSanitizedProblems() throws Exception {
        when(auth.authenticate(any())).thenThrow(new IllegalStateException(com.mybank.support.AuthTestConfig.PASSWORD));
        var result = mvc.perform(post("/api/auth/login").with(validCsrf()).contentType("application/json")
                        .content(com.mybank.support.AuthTestConfig.loginJson())).andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.code").value("INTERNAL_ERROR")).andReturn();
        assertThat(result.getResponse().getContentAsString()).doesNotContain(com.mybank.support.AuthTestConfig.PASSWORD);
        mvc.perform(post("/api/auth/login").with(validCsrf()).contentType("text/plain").content("x"))
                .andExpect(status().isUnsupportedMediaType()).andExpect(jsonPath("$.code").value("UNSUPPORTED_MEDIA_TYPE"));
    }
}

package com.mybank.auth;

import com.mybank.support.AuthTestConfig;
import jakarta.servlet.Filter;
import java.net.CookieManager;
import java.net.CookiePolicy;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import static org.assertj.core.api.Assertions.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@Import(SessionTimeoutIntegrationTest.ShortNativeTimeoutConfig.class)
class SessionTimeoutIntegrationTest {
    @LocalServerPort int port;
    @DynamicPropertySource
    static void credentials(DynamicPropertyRegistry registry) { AuthTestConfig.properties(registry); }
    @TestConfiguration(proxyBeanMethods = false)
    static class ShortNativeTimeoutConfig {
        @Bean
        FilterRegistrationBean<Filter> shortSessionTimeout() {
            FilterRegistrationBean<Filter> registration = new FilterRegistrationBean<>((request, response, chain) -> {
                chain.doFilter(request, response);
                var session = ((jakarta.servlet.http.HttpServletRequest) request).getSession(false);
                if (session != null) session.setMaxInactiveInterval(1);
            });
            registration.setUrlPatterns(java.util.List.of("/api/auth/login"));
            // Após Spring Security, encurta somente a sessão real do teste; Tomcat arredonda configuração para minutos.
            registration.setOrder(0);
            return registration;
        }
    }
    @Test
    void nativeContainerTimeout_oldCookieReceives401AndCookieIsNonPersistent() throws Exception {
        var jar = new CookieManager(null, CookiePolicy.ACCEPT_ALL);
        var client = HttpClient.newBuilder().cookieHandler(jar).connectTimeout(Duration.ofSeconds(5)).build();
        String base = "http://localhost:" + port;
        var bootstrap = client.send(HttpRequest.newBuilder(URI.create(base + "/api/auth/csrf")).GET().build(), HttpResponse.BodyHandlers.ofString());
        assertThat(bootstrap.statusCode()).isEqualTo(204);
        String token = jar.getCookieStore().getCookies().stream().filter(cookie -> cookie.getName().equals("XSRF-TOKEN"))
                .findFirst().orElseThrow().getValue();
        var login = client.send(HttpRequest.newBuilder(URI.create(base + "/api/auth/login"))
                .header("Content-Type", "application/json").header("X-XSRF-TOKEN", token)
                .POST(HttpRequest.BodyPublishers.ofString(AuthTestConfig.loginJson())).build(), HttpResponse.BodyHandlers.ofString());
        assertThat(login.statusCode()).isEqualTo(200);
        String cookieHeader = login.headers().allValues("set-cookie").stream().filter(value -> value.startsWith("JSESSIONID="))
                .findFirst().orElseThrow();
        assertThat(cookieHeader).contains("HttpOnly", "SameSite=Lax", "Path=/").doesNotContain("Max-Age", "Expires", "Domain=");
        var sessionCookie = jar.getCookieStore().getCookies().stream().filter(cookie -> cookie.getName().equals("JSESSIONID"))
                .findFirst().orElseThrow();
        assertThat(sessionCookie.getMaxAge()).isEqualTo(-1);

        Thread.sleep(2200);
        var me = client.send(HttpRequest.newBuilder(URI.create(base + "/api/auth/me")).GET().build(), HttpResponse.BodyHandlers.ofString());

        assertThat(me.statusCode()).isEqualTo(401);
        assertThat(me.body()).contains("SESSION_EXPIRED").doesNotContain(AuthTestConfig.EMAIL, AuthTestConfig.PASSWORD);
    }
}

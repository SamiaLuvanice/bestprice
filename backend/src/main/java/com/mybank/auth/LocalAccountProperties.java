package com.mybank.auth;

import org.springframework.boot.context.properties.ConfigurationProperties;
import java.util.Locale;

@ConfigurationProperties("bank.auth")
public class LocalAccountProperties {
    private String email;
    private String password;

    public String getEmail() { return email; }
    public void setEmail(String email) {
        this.email = email == null ? null : email.trim().toLowerCase(Locale.ROOT);
    }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public void erasePassword() { password = null; }

    @Override
    public String toString() { return "LocalAccountProperties[password=[REDACTED]]"; }
}

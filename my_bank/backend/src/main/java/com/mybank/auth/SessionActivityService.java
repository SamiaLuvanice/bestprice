package com.mybank.auth;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import org.springframework.stereotype.Service;

@Service
public class SessionActivityService {
    private final Clock clock;
    private static final Duration IDLE_TIMEOUT = Duration.ofMinutes(30);
    public SessionActivityService(Clock clock) { this.clock = clock; }
    public Instant now() { return clock.instant(); }
    public boolean hasExpired(Instant lastActivity) {
        return lastActivity == null || !now().isBefore(lastActivity.plus(IDLE_TIMEOUT));
    }
    public Instant renew(Instant lastActivity, Instant acceptedAt) {
        return lastActivity == null || acceptedAt.isAfter(lastActivity) ? acceptedAt : lastActivity;
    }
}

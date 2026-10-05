package com.mybank.auth;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.*;

class SessionActivityServiceTest {
    private final Instant started = Instant.parse("2026-10-05T12:00:00Z");
    private SessionActivityService at(Instant instant) {
        return new SessionActivityService(Clock.fixed(instant, ZoneOffset.UTC));
    }
    @Test
    void hasExpired_atIdleBoundary_rejectsExactlyThirtyMinutes() {
        assertThat(at(started.plusMillis(1_799_999)).hasExpired(started)).isFalse();
        assertThat(at(started.plusSeconds(1800)).hasExpired(started)).isTrue();
        assertThat(at(started.plusSeconds(1801)).hasExpired(started)).isTrue();
    }
    @Test
    void renew_keepsLatestAcceptedRequestAndMovesDeadline() {
        var service = at(started.plusSeconds(1800));
        var renewed = service.renew(started, started.plusSeconds(1200));

        assertThat(service.hasExpired(renewed)).isFalse();
        assertThat(service.renew(renewed, started)).isEqualTo(renewed);
    }
}

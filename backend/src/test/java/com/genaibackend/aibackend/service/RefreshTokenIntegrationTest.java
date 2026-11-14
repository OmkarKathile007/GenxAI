package com.genaibackend.aibackend.service;

import com.genaibackend.aibackend.model.User;
import com.genaibackend.aibackend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import static org.junit.jupiter.api.Assertions.*;

/** Refresh tokens against real PostgreSQL. Same database rules as CreditServiceIntegrationTest. */
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import(RefreshTokenService.class)
@Transactional(propagation = Propagation.NOT_SUPPORTED)
@EnabledIfEnvironmentVariable(named = "BILLING_TEST_DB_URL", matches = ".+")
class RefreshTokenIntegrationTest {

    @DynamicPropertySource
    static void database(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", () -> System.getenv("BILLING_TEST_DB_URL"));
        registry.add("spring.datasource.username", () -> "postgres");
        registry.add("spring.datasource.password", () -> "");
        registry.add("spring.datasource.hikari.maximum-pool-size", () -> "10");
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "validate");
    }

    @Autowired private RefreshTokenService service;
    @Autowired private UserRepository users;
    @Autowired private JdbcTemplate jdbc;

    private User user;

    @BeforeEach
    void createUser() {
        String id = UUID.randomUUID().toString();
        long userId = jdbc.queryForObject(
                "INSERT INTO users (username, email, password) VALUES (?, ?, 'x') RETURNING id",
                Long.class, "u-" + id, id + "@test.local");
        user = users.findById(userId).orElseThrow();
    }

    /** Pushes a token's retirement back past the grace window. */
    private void retireLongAgo() {
        jdbc.update("UPDATE refresh_tokens SET rotated_at = now() - interval '5 minutes' "
                + "WHERE user_id = ? AND rotated_at IS NOT NULL", user.getId());
    }

    @Test
    void aTokenSwapsForANewOneAndNamesItsUser() {
        String first = service.issue(user);

        RefreshTokenService.Issued next = service.rotate(first).orElseThrow();

        assertNotEquals(first, next.rawToken());
        assertEquals(user.getId(), next.user().getId());
        assertEquals(user.getUsername(), next.user().getUsername(), "Read after the transaction has closed");
        assertTrue(service.rotate(next.rawToken()).isPresent());
    }

    @Test
    void theRawTokenIsNeverStored() {
        String raw = service.issue(user);

        assertEquals(0, jdbc.queryForObject(
                "SELECT count(*) FROM refresh_tokens WHERE token_hash = ?", Integer.class, raw));
        assertEquals(64, jdbc.queryForObject(
                "SELECT length(token_hash) FROM refresh_tokens WHERE user_id = ?", Integer.class, user.getId()));
    }

    @Test
    void reusingARetiredTokenKillsTheWholeSignIn() {
        String stolen = service.issue(user);
        String current = service.rotate(stolen).orElseThrow().rawToken();
        retireLongAgo();

        assertTrue(service.rotate(stolen).isEmpty(), "The stolen copy is refused");
        assertTrue(service.rotate(current).isEmpty(), "The newest token dies too, forcing a fresh sign-in");
        assertEquals(0, jdbc.queryForObject(
                "SELECT count(*) FROM refresh_tokens WHERE user_id = ? AND revoked_at IS NULL",
                Integer.class, user.getId()), "The revocation must survive the refusal");
    }

    @Test
    void anotherTabRefreshingAtTheSameMomentIsNotTreatedAsTheft() {
        String shared = service.issue(user);

        assertTrue(service.rotate(shared).isPresent());
        assertTrue(service.rotate(shared).isPresent(), "Inside the grace window");
    }

    @Test
    void concurrentRefreshesAllSurvive() throws Exception {
        String shared = service.issue(user);
        int threads = 6;
        ExecutorService pool = Executors.newFixedThreadPool(threads);
        CountDownLatch start = new CountDownLatch(1);
        List<Future<Boolean>> results = new ArrayList<>();
        for (int i = 0; i < threads; i++) {
            results.add(pool.submit(() -> {
                start.await();
                return service.rotate(shared).isPresent();
            }));
        }
        start.countDown();
        for (Future<Boolean> result : results) {
            assertTrue(result.get());
        }
        pool.shutdown();
    }

    @Test
    void anExpiredTokenIsRefused() {
        String token = service.issue(user);
        jdbc.update("UPDATE refresh_tokens SET expires_at = now() - interval '1 minute' WHERE user_id = ?", user.getId());

        assertTrue(service.rotate(token).isEmpty());
    }

    @Test
    void logoutEndsTheSignIn() {
        String first = service.issue(user);
        String current = service.rotate(first).orElseThrow().rawToken();

        service.revoke(current);

        assertTrue(service.rotate(current).isEmpty());
        assertTrue(service.rotate(first).isEmpty());
    }

    @Test
    void logoutLeavesOtherDevicesSignedIn() {
        String laptop = service.issue(user);
        String phone = service.issue(user);

        service.revoke(laptop);

        assertTrue(service.rotate(phone).isPresent());
    }

    @Test
    void unknownOrMissingTokensAreRefusedQuietly() {
        assertTrue(service.rotate("not-a-real-token").isEmpty());
        assertTrue(service.rotate(null).isEmpty());
        assertTrue(service.rotate("").isEmpty());
        assertDoesNotThrow(() -> service.revoke("not-a-real-token"));
    }
}

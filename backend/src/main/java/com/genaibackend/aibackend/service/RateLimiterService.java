package com.genaibackend.aibackend.service;

import com.genaibackend.aibackend.entity.RateLimit;
import com.genaibackend.aibackend.repository.RateLimitRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class RateLimiterService {

    private static final Logger log = LoggerFactory.getLogger(RateLimiterService.class);



    private static final int MAX_REQUESTS = 3;


    private static final int WINDOW_HOURS = 24;

    private final RateLimitRepository rateLimitRepository;

    public RateLimiterService(RateLimitRepository rateLimitRepository) {
        this.rateLimitRepository = rateLimitRepository;
    }

    /**
     * Core method. Call on every AI request.
     *
     * @param username extracted from JWT token
     * @return true  → request is ALLOWED
     *         false → request is BLOCKED (limit exceeded)
     *
     * @Transactional ensures the SELECT FOR UPDATE + UPDATE happen
     * in a single atomic DB transaction. No race conditions.
     */
    @Transactional
    public boolean isAllowed(String username) {
        LocalDateTime now = LocalDateTime.now();

        // Try to find existing record, with row-level lock
        RateLimit record = rateLimitRepository
                .findByUsernameWithLock(username)
                .orElse(null);

        // ── Brand new user: create their first record ──────────────────────
        if (record == null) {
            RateLimit newRecord = new RateLimit(username);
            newRecord.setRequestCount(1);
            rateLimitRepository.save(newRecord);
            log.info("[RATE-LIMIT] NEW user={} count=1/{}", username, MAX_REQUESTS);
            return true;
        }

        // ── Check if the window has expired ────────────────────────────────
        LocalDateTime windowExpiry = record.getWindowStart().plusHours(WINDOW_HOURS);
        boolean windowExpired = now.isAfter(windowExpiry);

        if (windowExpired) {
            // Window expired → reset the counter, start a new window
            record.setRequestCount(1);
            record.setWindowStart(now);
            record.setLastRequestAt(now);
            rateLimitRepository.save(record);
            log.info("[RATE-LIMIT] WINDOW-RESET user={} count=1/{}", username, MAX_REQUESTS);
            return true;
        }

        // ── Window still active → check count ──────────────────────────────
        int currentCount = record.getRequestCount();

        if (currentCount >= MAX_REQUESTS) {
            // BLOCKED
            log.warn("[RATE-LIMIT] BLOCKED user={} count={}/{} windowExpiry={}",
                    username, currentCount, MAX_REQUESTS, windowExpiry);
            return false;
        }

        // ALLOWED → increment and save
        record.setRequestCount(currentCount + 1);
        record.setLastRequestAt(now);
        rateLimitRepository.save(record);
        log.info("[RATE-LIMIT] ALLOWED user={} count={}/{}", username, currentCount + 1, MAX_REQUESTS);
        return true;
    }

    /**
     * Returns seconds until the window resets for a given user.
     * Used by the frontend to show "try again in X minutes".
     */
    @Transactional(readOnly = true)
    public long getSecondsUntilReset(String username) {
        return rateLimitRepository.findByUsernameWithLock(username)
                .map(record -> {
                    LocalDateTime expiry = record.getWindowStart().plusHours(WINDOW_HOURS);
                    long seconds = java.time.Duration.between(LocalDateTime.now(), expiry).getSeconds();
                    return Math.max(0, seconds);
                })
                .orElse(0L);
    }
}
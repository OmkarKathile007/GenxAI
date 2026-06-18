package com.genaibackend.aibackend.service;

import com.genaibackend.aibackend.entity.UsageCounter;
import com.genaibackend.aibackend.exception.LimitExceededException;
import com.genaibackend.aibackend.repository.UsageCounterRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Enforces free-tier lifetime caps per user: a maximum number of outbound
 * voice calls and a maximum number of AI generations. Voice calls are also
 * capped in duration (see {@link #getMaxCallSeconds()}, applied by the caller).
 *
 * All limits are configurable; set {@code app.limits.enabled=false} to disable.
 */
@Service
public class UsageService {

    private static final Logger log = LoggerFactory.getLogger(UsageService.class);

    @Value("${app.limits.enabled:true}")
    private boolean enabled;

    @Value("${app.limits.vapi.max-calls:2}")
    private int maxVapiCalls;

    @Value("${app.limits.vapi.max-call-seconds:30}")
    private int maxCallSeconds;

    @Value("${app.limits.ai.max-calls:2}")
    private int maxAiCalls;

    private final UsageCounterRepository repository;

    public UsageService(UsageCounterRepository repository) {
        this.repository = repository;
    }

    public boolean isEnabled() {
        return enabled;
    }

    /** Per-call duration cap (seconds) applied to outbound Vapi calls. */
    public int getMaxCallSeconds() {
        return maxCallSeconds;
    }

    /**
     * Reserve one voice call for the user, throwing {@link LimitExceededException}
     * if they've reached their cap. Call this before placing the Vapi call.
     */
    @Transactional
    public void consumeVapiCall(String username) {
        if (!enabled || username == null) return;
        UsageCounter c = lockOrCreate(username);
        if (c.getVapiCalls() >= maxVapiCalls) {
            throw new LimitExceededException(
                    "You've used all " + maxVapiCalls + " free calls. Upgrade to place more calls.");
        }
        c.setVapiCalls(c.getVapiCalls() + 1);
        repository.save(c);
        log.info("[LIMIT] vapi user={} count={}/{}", username, c.getVapiCalls(), maxVapiCalls);
    }

    /**
     * Reserve one AI generation for the user, throwing if the cap is reached.
     * Username is read from the security context; no-ops outside a request.
     */
    @Transactional
    public void consumeAi() {
        if (!enabled) return;
        String username = currentUsername();
        if (username == null) return; // async/unauthenticated path — skip
        UsageCounter c = lockOrCreate(username);
        if (c.getAiCalls() >= maxAiCalls) {
            throw new LimitExceededException(
                    "You've used all " + maxAiCalls + " free AI generations. Upgrade for more.");
        }
        c.setAiCalls(c.getAiCalls() + 1);
        repository.save(c);
        log.info("[LIMIT] ai user={} count={}/{}", username, c.getAiCalls(), maxAiCalls);
    }

    private UsageCounter lockOrCreate(String username) {
        return repository.findByUsernameWithLock(username)
                .orElseGet(() -> repository.save(new UsageCounter(username)));
    }

    private String currentUsername() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) return null;
        String name = auth.getName();
        return (name == null || "anonymousUser".equals(name)) ? null : name;
    }
}

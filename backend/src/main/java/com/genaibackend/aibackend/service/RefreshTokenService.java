package com.genaibackend.aibackend.service;

import com.genaibackend.aibackend.entity.RefreshToken;
import com.genaibackend.aibackend.model.User;
import com.genaibackend.aibackend.repository.RefreshTokenRepository;
import org.hibernate.Hibernate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Optional;
import java.util.UUID;

/**
 * Issues and rotates refresh tokens. Each use retires the token and returns a new
 * one, so a stolen copy stops working the moment either party uses it, and a
 * second use of a retired token reveals the theft.
 */
@Service
public class RefreshTokenService {

    /** A new token and the user it signs in. */
    public record Issued(String rawToken, User user) {}

    private static final Logger log = LoggerFactory.getLogger(RefreshTokenService.class);

    /**
     * Two tabs can refresh with the same token at the same moment. A retired token
     * reused this soon is treated as that, not as theft, so tabs don't sign each
     * other out.
     */
    static final int REUSE_GRACE_SECONDS = 20;

    private static final int TOKEN_BYTES = 32;
    private static final int KEEP_EXPIRED_DAYS = 7;

    private final SecureRandom random = new SecureRandom();
    private final RefreshTokenRepository tokens;
    private final long validDays;

    public RefreshTokenService(RefreshTokenRepository tokens,
                               @Value("${auth.refresh.days:30}") long validDays) {
        this.tokens = tokens;
        this.validDays = validDays;
    }

    /** Starts a new family. Call once per sign-in. */
    @Transactional
    public String issue(User user) {
        return issueInFamily(user, UUID.randomUUID().toString());
    }

    /**
     * Swaps a token for a new one. Empty means the caller must sign in again.
     * Returning empty rather than throwing matters: revoking a family on reuse
     * has to commit, and an exception would roll it back.
     */
    @Transactional
    public Optional<Issued> rotate(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) return Optional.empty();
        RefreshToken token = tokens.lockByHash(hash(rawToken)).orElse(null);
        LocalDateTime now = LocalDateTime.now();
        if (token == null || token.getRevokedAt() != null || !token.getExpiresAt().isAfter(now)) {
            return Optional.empty();
        }

        if (token.getRotatedAt() == null) {
            token.setRotatedAt(now);
            tokens.save(token);
        } else if (token.getRotatedAt().isBefore(now.minusSeconds(REUSE_GRACE_SECONDS))) {
            log.warn("Retired refresh token reused, revoking family {} of user {}",
                    token.getFamilyId(), token.getUser().getId());
            tokens.revokeFamily(token.getFamilyId(), now);
            return Optional.empty();
        }
        User user = token.getUser();
        Hibernate.initialize(user); // the caller reads it after this transaction closes
        return Optional.of(new Issued(issueInFamily(user, token.getFamilyId()), user));
    }

    /** Ends the sign-in this token belongs to. Unknown tokens are ignored. */
    @Transactional
    public void revoke(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) return;
        tokens.lockByHash(hash(rawToken))
                .ifPresent(token -> tokens.revokeFamily(token.getFamilyId(), LocalDateTime.now()));
    }

    @Scheduled(fixedDelay = 86_400_000, initialDelay = 300_000)
    @Transactional
    public void deleteExpired() {
        tokens.deleteExpiredBefore(LocalDateTime.now().minusDays(KEEP_EXPIRED_DAYS));
    }

    private String issueInFamily(User user, String familyId) {
        byte[] bytes = new byte[TOKEN_BYTES];
        random.nextBytes(bytes);
        String raw = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        tokens.save(new RefreshToken(user, familyId, hash(raw), LocalDateTime.now().plusDays(validDays)));
        return raw;
    }

    private static String hash(String rawToken) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 unavailable", e);
        }
    }
}

package com.genaibackend.aibackend.filter;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.genaibackend.aibackend.service.RateLimiterService;
import com.genaibackend.aibackend.security.JwtUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;

@Component
public class RateLimitFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(RateLimitFilter.class);

    private final RateLimiterService rateLimiterService;
    private final JwtUtil jwtUtil;
    private final ObjectMapper objectMapper;

    public RateLimitFilter(RateLimiterService rateLimiterService,
                           JwtUtil jwtUtil,
                           ObjectMapper objectMapper) {
        this.rateLimiterService = rateLimiterService;
        this.jwtUtil = jwtUtil;
        this.objectMapper = objectMapper;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        // intercept POST requests to /api/ai/* (the Gemini-calling endpoints)
        // GET requests like /api/ai/job/{id} (status checks) are NOT rate limited
        String path = request.getRequestURI();
        String method = request.getMethod();

        boolean isAiPostRequest = path.startsWith("/api/ai/")
                && method.equals("POST");

        if (!isAiPostRequest) {
            filterChain.doFilter(request, response);
            return;
        }

        // ── Extract username from JWT ─────────────────────────────────────
        String username = extractUsernameFromRequest(request);

        if (username == null) {
            // No valid token →  Spring Security handle it (will return 403)
            filterChain.doFilter(request, response);
            return;
        }

        //  Check rate limit
        boolean allowed = rateLimiterService.isAllowed(username);

        if (!allowed) {
            long secondsUntilReset = rateLimiterService.getSecondsUntilReset(username);
            long minutesUntilReset = (secondsUntilReset / 60) + 1;

            log.warn("[RATE-LIMIT] Request BLOCKED for user={} path={}", username, path);

            // Return 429 with a clear JSON body the frontend can read
            response.setStatus(429);
            response.setContentType("application/json");
            response.getWriter().write(
                    objectMapper.writeValueAsString(Map.of(
                            "status", 429,
                            "error", "Rate limit exceeded",
                            "message", "You have used all 15 daily AI requests. Resets in " + minutesUntilReset + " minutes.",
                            "retryAfterSeconds", secondsUntilReset,
                            "retryAfterMinutes", minutesUntilReset
                    ))
            );
            return;
        }

        // ── Allowed: proceed to controller ───────────────────────────────
        filterChain.doFilter(request, response);
    }

    /**
     * Pulls the JWT from the Authorization header and extracts the username.
     * Returns null if no valid token exists.
     */
    private String extractUsernameFromRequest(HttpServletRequest request) {
        try {
            String authHeader = request.getHeader("Authorization");
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return null;
            }
            String token = authHeader.substring(7);
            return jwtUtil.extractUsername(token);
        } catch (Exception e) {
            log.warn("[RATE-LIMIT] Could not extract username from token: {}", e.getMessage());
            return null;
        }
    }
}
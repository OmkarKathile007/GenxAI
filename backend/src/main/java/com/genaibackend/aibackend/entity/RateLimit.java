package com.genaibackend.aibackend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "rate_limits")
public class RateLimit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // One row per user. Unique so we can do atomic .
    @Column(nullable = false, unique = true)
    private String username;

    // AI requests in the current window
    @Column(nullable = false)
    private int requestCount;

    // current window started
    @Column(nullable = false)
    private LocalDateTime windowStart;

    // Last request timestamp (for logging)
    @Column(nullable = false)
    private LocalDateTime lastRequestAt;

    public RateLimit() {}

    public RateLimit(String username) {
        this.username = username;
        this.requestCount = 0;
        this.windowStart = LocalDateTime.now();
        this.lastRequestAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public int getRequestCount() { return requestCount; }
    public void setRequestCount(int requestCount) { this.requestCount = requestCount; }
    public LocalDateTime getWindowStart() { return windowStart; }
    public void setWindowStart(LocalDateTime windowStart) { this.windowStart = windowStart; }
    public LocalDateTime getLastRequestAt() { return lastRequestAt; }
    public void setLastRequestAt(LocalDateTime lastRequestAt) { this.lastRequestAt = lastRequestAt; }
}
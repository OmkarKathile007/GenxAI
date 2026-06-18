package com.genaibackend.aibackend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Lifetime usage counters per user, used to enforce free-tier hard caps
 * (e.g. a first-time user may place only N voice calls and run only N AI
 * generations total). One row per user.
 */
@Entity
@Table(name = "usage_counters")
public class UsageCounter {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = false)
    private int vapiCalls;

    @Column(nullable = false)
    private int aiCalls;

    public UsageCounter() {}

    public UsageCounter(String username) {
        this.username = username;
        this.vapiCalls = 0;
        this.aiCalls = 0;
    }

    public Long getId() { return id; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public int getVapiCalls() { return vapiCalls; }
    public void setVapiCalls(int vapiCalls) { this.vapiCalls = vapiCalls; }

    public int getAiCalls() { return aiCalls; }
    public void setAiCalls(int aiCalls) { this.aiCalls = aiCalls; }
}

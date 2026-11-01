package com.genaibackend.aibackend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.genaibackend.aibackend.model.User;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "roadmaps")
public class Roadmap {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private String title; // e.g., "Learn AWS Lambda"

    // IMPORTANT: This stores the entire 7-day JSON structure
    // including the state of checkboxes (true/false)
    @Column(columnDefinition = "TEXT")
    private String roadmapJson;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    //  User who owns this roadmap
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    @JsonIgnore // infinite recursion in JSON
    private User user;

    // Tenant. Nullable to match the nullable user column above — rows with no
    // user cannot be attributed to an org. Reads are scoped by this.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id")
    @JsonIgnore
    private Organization organization;

    public Roadmap() {}

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // --- Getters and Setters ---
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getRoadmapJson() { return roadmapJson; }
    public void setRoadmapJson(String roadmapJson) { this.roadmapJson = roadmapJson; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    @JsonIgnore
    public Organization getOrganization() { return organization; }
    public void setOrganization(Organization organization) { this.organization = organization; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
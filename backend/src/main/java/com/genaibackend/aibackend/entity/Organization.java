package com.genaibackend.aibackend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

/**
 * A tenant. Every piece of customer data in the platform belongs to exactly one
 * Organization, and all reads are scoped to the caller's current org.
 *
 * Existing single-user accounts were migrated in V3 to a "personal" org of one
 * member, so tenancy is invisible to them until they invite a teammate.
 */
@Entity
@Table(name = "organizations")
public class Organization {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String name;

    /**
     * URL-safe unique handle. Generated from the owner's username on migration;
     * used later for org-scoped URLs and SSO discovery.
     */
    @Column(nullable = false, unique = true)
    private String slug;

    /**
     * True for the auto-created one-member org every legacy user was migrated
     * into. Lets us treat "user has never really set up a team" differently in
     * onboarding without a second lookup.
     */
    @Column(nullable = false)
    private boolean personal = false;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }

    public boolean isPersonal() { return personal; }
    public void setPersonal(boolean personal) { this.personal = personal; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}

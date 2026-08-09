package com.genaibackend.aibackend.entity;

import com.genaibackend.aibackend.model.OrgRole;
import com.genaibackend.aibackend.model.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.time.LocalDateTime;

/**
 * Joins a {@link com.genaibackend.aibackend.model.User} to an
 * {@link Organization} with a role. This is the authorization edge: a user may
 * act inside an org if and only if a Membership row exists.
 *
 * A user may belong to several organizations (e.g. an agency working across
 * client accounts), so this is a true many-to-many with a payload rather than a
 * column on User.
 */
@Entity
@Table(
        name = "memberships",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_memberships_org_user",
                columnNames = {"organization_id", "user_id"}
        )
)
public class Membership {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "organization_id", nullable = false)
    private Organization organization;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrgRole role = OrgRole.MEMBER;

    /**
     * Marks the org a user lands in when they sign in without naming one.
     * Enforced to at most one per user by a partial unique index in V3.
     */
    @Column(nullable = false)
    private boolean defaultOrg = false;

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.role == null) this.role = OrgRole.MEMBER;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public Organization getOrganization() { return organization; }
    public void setOrganization(Organization organization) { this.organization = organization; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public OrgRole getRole() { return role; }
    public void setRole(OrgRole role) { this.role = role; }

    public boolean isDefaultOrg() { return defaultOrg; }
    public void setDefaultOrg(boolean defaultOrg) { this.defaultOrg = defaultOrg; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}

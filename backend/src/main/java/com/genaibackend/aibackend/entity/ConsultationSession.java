package com.genaibackend.aibackend.entity;

import com.genaibackend.aibackend.model.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

/**
 * A deeper on-platform voice consultation a customer runs after opening their
 * invite link. The agent is configured for the customer's business; Vapi call
 * analysis extracts the customer's detailed needs + services into
 * {@link #structuredData}.
 */
@Entity
@Table(name = "consultation_sessions", indexes = {
        @Index(name = "idx_consult_vapi_id", columnList = "vapiCallId")
})
public class ConsultationSession {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "contact_id", nullable = false)
    private Contact contact;

    private String inviteId;
    private String vapiCallId;

    /** IN_PROGRESS, ENDED, FAILED */
    @Column(nullable = false)
    private String status = "IN_PROGRESS";

    @Column(columnDefinition = "TEXT")
    private String transcript;

    @Column(columnDefinition = "TEXT")
    private String summary;

    /** JSON blob of extracted customer details + services (Vapi structuredData). */
    @Column(columnDefinition = "TEXT")
    private String structuredData;

    @Column(columnDefinition = "TEXT")
    private String recordingUrl;

    private LocalDateTime createdAt;
    private LocalDateTime endedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.status == null) this.status = "IN_PROGRESS";
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public User getOwner() { return owner; }
    public void setOwner(User owner) { this.owner = owner; }

    public Contact getContact() { return contact; }
    public void setContact(Contact contact) { this.contact = contact; }

    public String getInviteId() { return inviteId; }
    public void setInviteId(String inviteId) { this.inviteId = inviteId; }

    public String getVapiCallId() { return vapiCallId; }
    public void setVapiCallId(String vapiCallId) { this.vapiCallId = vapiCallId; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getTranscript() { return transcript; }
    public void setTranscript(String transcript) { this.transcript = transcript; }

    public String getSummary() { return summary; }
    public void setSummary(String summary) { this.summary = summary; }

    public String getStructuredData() { return structuredData; }
    public void setStructuredData(String structuredData) { this.structuredData = structuredData; }

    public String getRecordingUrl() { return recordingUrl; }
    public void setRecordingUrl(String recordingUrl) { this.recordingUrl = recordingUrl; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getEndedAt() { return endedAt; }
    public void setEndedAt(LocalDateTime endedAt) { this.endedAt = endedAt; }
}

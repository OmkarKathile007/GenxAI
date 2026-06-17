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
 * One Vapi outbound phone call placed to a {@link Contact}. Created when the
 * "Call" button fires; status/transcript/recording are filled in later from
 * Vapi server webhooks (status-update, end-of-call-report).
 */
@Entity
@Table(name = "voice_calls", indexes = {
        @Index(name = "idx_voice_calls_vapi_id", columnList = "vapiCallId")
})
public class VoiceCall {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "contact_id", nullable = false)
    private Contact contact;

    private String vapiCallId;

    /** QUALIFY (first mobile call) etc. */
    private String type = "QUALIFY";

    /** QUEUED, RINGING, IN_PROGRESS, ENDED, FAILED */
    @Column(nullable = false)
    private String status = "QUEUED";

    @Column(columnDefinition = "TEXT")
    private String transcript;

    @Column(columnDefinition = "TEXT")
    private String summary;

    @Column(columnDefinition = "TEXT")
    private String recordingUrl;

    private String endedReason;

    /** Extracted from Vapi call analysis: did the customer agree/qualify? */
    private Boolean qualified;

    private LocalDateTime startedAt;
    private LocalDateTime endedAt;
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.status == null) this.status = "QUEUED";
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public User getOwner() { return owner; }
    public void setOwner(User owner) { this.owner = owner; }

    public Contact getContact() { return contact; }
    public void setContact(Contact contact) { this.contact = contact; }

    public String getVapiCallId() { return vapiCallId; }
    public void setVapiCallId(String vapiCallId) { this.vapiCallId = vapiCallId; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getTranscript() { return transcript; }
    public void setTranscript(String transcript) { this.transcript = transcript; }

    public String getSummary() { return summary; }
    public void setSummary(String summary) { this.summary = summary; }

    public String getRecordingUrl() { return recordingUrl; }
    public void setRecordingUrl(String recordingUrl) { this.recordingUrl = recordingUrl; }

    public String getEndedReason() { return endedReason; }
    public void setEndedReason(String endedReason) { this.endedReason = endedReason; }

    public Boolean getQualified() { return qualified; }
    public void setQualified(Boolean qualified) { this.qualified = qualified; }

    public LocalDateTime getStartedAt() { return startedAt; }
    public void setStartedAt(LocalDateTime startedAt) { this.startedAt = startedAt; }

    public LocalDateTime getEndedAt() { return endedAt; }
    public void setEndedAt(LocalDateTime endedAt) { this.endedAt = endedAt; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}

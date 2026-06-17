package com.genaibackend.aibackend.dto;

import com.genaibackend.aibackend.entity.ConsultationSession;

import java.time.LocalDateTime;

public class ConsultationResponse {

    private String id;
    private String contactId;
    private String contactName;
    private String contactPhone;
    private String status;
    private String summary;
    private String transcript;
    /** Raw JSON string of extracted customer details + services. */
    private String structuredData;
    private String recordingUrl;
    private LocalDateTime createdAt;
    private LocalDateTime endedAt;

    public static ConsultationResponse from(ConsultationSession s) {
        ConsultationResponse r = new ConsultationResponse();
        r.id = s.getId();
        if (s.getContact() != null) {
            r.contactId = s.getContact().getId();
            r.contactName = s.getContact().getFullName();
            r.contactPhone = s.getContact().getPhone();
        }
        r.status = s.getStatus();
        r.summary = s.getSummary();
        r.transcript = s.getTranscript();
        r.structuredData = s.getStructuredData();
        r.recordingUrl = s.getRecordingUrl();
        r.createdAt = s.getCreatedAt();
        r.endedAt = s.getEndedAt();
        return r;
    }

    public String getId() { return id; }
    public String getContactId() { return contactId; }
    public String getContactName() { return contactName; }
    public String getContactPhone() { return contactPhone; }
    public String getStatus() { return status; }
    public String getSummary() { return summary; }
    public String getTranscript() { return transcript; }
    public String getStructuredData() { return structuredData; }
    public String getRecordingUrl() { return recordingUrl; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getEndedAt() { return endedAt; }
}

package com.genaibackend.aibackend.dto;

import com.genaibackend.aibackend.entity.VoiceCall;

import java.time.LocalDateTime;

public class VoiceCallResponse {

    private String id;
    private String contactId;
    private String contactName;
    private String contactPhone;
    private String vapiCallId;
    private String type;
    private String status;
    private String transcript;
    private String summary;
    private String recordingUrl;
    private String endedReason;
    private Boolean qualified;
    private LocalDateTime startedAt;
    private LocalDateTime endedAt;
    private LocalDateTime createdAt;

    public static VoiceCallResponse from(VoiceCall call) {
        VoiceCallResponse r = new VoiceCallResponse();
        r.id = call.getId();
        if (call.getContact() != null) {
            r.contactId = call.getContact().getId();
            r.contactName = call.getContact().getFullName();
            r.contactPhone = call.getContact().getPhone();
        }
        r.vapiCallId = call.getVapiCallId();
        r.type = call.getType();
        r.status = call.getStatus();
        r.transcript = call.getTranscript();
        r.summary = call.getSummary();
        r.recordingUrl = call.getRecordingUrl();
        r.endedReason = call.getEndedReason();
        r.qualified = call.getQualified();
        r.startedAt = call.getStartedAt();
        r.endedAt = call.getEndedAt();
        r.createdAt = call.getCreatedAt();
        return r;
    }

    public String getId() { return id; }
    public String getContactId() { return contactId; }
    public String getContactName() { return contactName; }
    public String getContactPhone() { return contactPhone; }
    public String getVapiCallId() { return vapiCallId; }
    public String getType() { return type; }
    public String getStatus() { return status; }
    public String getTranscript() { return transcript; }
    public String getSummary() { return summary; }
    public String getRecordingUrl() { return recordingUrl; }
    public String getEndedReason() { return endedReason; }
    public Boolean getQualified() { return qualified; }
    public LocalDateTime getStartedAt() { return startedAt; }
    public LocalDateTime getEndedAt() { return endedAt; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}

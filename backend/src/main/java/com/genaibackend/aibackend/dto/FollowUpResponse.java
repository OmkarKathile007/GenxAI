package com.genaibackend.aibackend.dto;

import com.genaibackend.aibackend.entity.FollowUp;

import java.time.LocalDateTime;

public class FollowUpResponse {

    private String id;
    private String contactId;
    private String contactName;
    private String contactPhone;
    private String channel;
    private String message;
    private String status;
    private String errorMessage;
    private LocalDateTime sentAt;
    private LocalDateTime createdAt;

    public static FollowUpResponse from(FollowUp f) {
        FollowUpResponse r = new FollowUpResponse();
        r.id = f.getId();
        if (f.getContact() != null) {
            r.contactId = f.getContact().getId();
            r.contactName = f.getContact().getFullName();
            r.contactPhone = f.getContact().getPhone();
        }
        r.channel = f.getChannel();
        r.message = f.getMessage();
        r.status = f.getStatus();
        r.errorMessage = f.getErrorMessage();
        r.sentAt = f.getSentAt();
        r.createdAt = f.getCreatedAt();
        return r;
    }

    public String getId() { return id; }
    public String getContactId() { return contactId; }
    public String getContactName() { return contactName; }
    public String getContactPhone() { return contactPhone; }
    public String getChannel() { return channel; }
    public String getMessage() { return message; }
    public String getStatus() { return status; }
    public String getErrorMessage() { return errorMessage; }
    public LocalDateTime getSentAt() { return sentAt; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}

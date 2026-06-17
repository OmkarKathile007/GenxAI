package com.genaibackend.aibackend.dto;

import com.genaibackend.aibackend.entity.Invite;

import java.time.LocalDateTime;

public class InviteResponse {

    private String id;
    private String contactId;
    private String contactName;
    private String channel;
    private String url;
    private String message;
    private String status;
    private String errorMessage;
    private boolean accepted;
    private LocalDateTime sentAt;
    private LocalDateTime createdAt;

    public static InviteResponse from(Invite invite) {
        InviteResponse r = new InviteResponse();
        r.id = invite.getId();
        if (invite.getContact() != null) {
            r.contactId = invite.getContact().getId();
            r.contactName = invite.getContact().getFullName();
        }
        r.channel = invite.getChannel();
        r.url = invite.getUrl();
        r.message = invite.getMessage();
        r.status = invite.getStatus();
        r.errorMessage = invite.getErrorMessage();
        r.accepted = invite.isAccepted();
        r.sentAt = invite.getSentAt();
        r.createdAt = invite.getCreatedAt();
        return r;
    }

    public String getId() { return id; }
    public String getContactId() { return contactId; }
    public String getContactName() { return contactName; }
    public String getChannel() { return channel; }
    public String getUrl() { return url; }
    public String getMessage() { return message; }
    public String getStatus() { return status; }
    public String getErrorMessage() { return errorMessage; }
    public boolean isAccepted() { return accepted; }
    public LocalDateTime getSentAt() { return sentAt; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}

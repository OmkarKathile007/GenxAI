package com.genaibackend.aibackend.dto;

/** Ask the AI to draft a follow-up for a contact on a channel. */
public class GenerateFollowUpRequest {

    private String contactId;
    private String channel; // WHATSAPP | SMS | EMAIL

    public String getContactId() { return contactId; }
    public void setContactId(String contactId) { this.contactId = contactId; }

    public String getChannel() { return channel; }
    public void setChannel(String channel) { this.channel = channel; }
}

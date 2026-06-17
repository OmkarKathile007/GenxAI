package com.genaibackend.aibackend.dto;

/** Request to send a platform invite to a contact over a channel. */
public class SendInviteRequest {

    /** SMS or WHATSAPP. Falls back to the server default when blank. */
    private String channel;

    public String getChannel() { return channel; }
    public void setChannel(String channel) { this.channel = channel; }
}

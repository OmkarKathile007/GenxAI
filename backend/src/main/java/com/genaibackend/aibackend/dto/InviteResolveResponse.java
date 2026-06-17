package com.genaibackend.aibackend.dto;

import java.util.Map;

/**
 * Public payload returned when a customer opens their invite link. Carries the
 * greeting context plus the Vapi assistantOverrides the browser uses to start
 * the per-business deep consultation.
 */
public class InviteResolveResponse {

    private boolean valid;
    private boolean used;
    private String contactName;
    private String businessName;
    private String agentName;
    private Map<String, Object> assistantOverrides;

    public static InviteResolveResponse invalid() {
        InviteResolveResponse r = new InviteResolveResponse();
        r.valid = false;
        return r;
    }

    public boolean isValid() { return valid; }
    public void setValid(boolean valid) { this.valid = valid; }

    public boolean isUsed() { return used; }
    public void setUsed(boolean used) { this.used = used; }

    public String getContactName() { return contactName; }
    public void setContactName(String contactName) { this.contactName = contactName; }

    public String getBusinessName() { return businessName; }
    public void setBusinessName(String businessName) { this.businessName = businessName; }

    public String getAgentName() { return agentName; }
    public void setAgentName(String agentName) { this.agentName = agentName; }

    public Map<String, Object> getAssistantOverrides() { return assistantOverrides; }
    public void setAssistantOverrides(Map<String, Object> assistantOverrides) { this.assistantOverrides = assistantOverrides; }
}

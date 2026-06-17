package com.genaibackend.aibackend.entity;

import com.genaibackend.aibackend.model.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "businesses")
public class Business {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @Column(nullable = false)
    private String businessName;

    private String industry;
    private String website;
    private String location;
    private String timezone;
    private String workingHours;
    private String preferredLanguage;
    private String callTone;

    // --- AI agent configuration ---
    private String agentName;
    private String agentVoice;

    @Column(columnDefinition = "TEXT")
    private String callObjective;

    @Column(columnDefinition = "TEXT")
    private String qualificationQuestions;

    @Column(columnDefinition = "TEXT")
    private String agentGuardrails;

    /** AI-generated objection-handling playbook injected into every call prompt. */
    @Column(columnDefinition = "TEXT")
    private String objectionPlaybook;

    @Column(columnDefinition = "TEXT")
    private String productsServices;

    @Column(columnDefinition = "TEXT")
    private String targetAudience;

    @Column(columnDefinition = "TEXT")
    private String salesGoal;

    @Column(columnDefinition = "TEXT")
    private String commonFaqs;

    @Column(columnDefinition = "TEXT")
    private String pricingInfo;

    private boolean setupComplete;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public User getOwner() { return owner; }
    public void setOwner(User owner) { this.owner = owner; }

    public String getBusinessName() { return businessName; }
    public void setBusinessName(String businessName) { this.businessName = businessName; }

    public String getIndustry() { return industry; }
    public void setIndustry(String industry) { this.industry = industry; }

    public String getWebsite() { return website; }
    public void setWebsite(String website) { this.website = website; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getTimezone() { return timezone; }
    public void setTimezone(String timezone) { this.timezone = timezone; }

    public String getWorkingHours() { return workingHours; }
    public void setWorkingHours(String workingHours) { this.workingHours = workingHours; }

    public String getPreferredLanguage() { return preferredLanguage; }
    public void setPreferredLanguage(String preferredLanguage) { this.preferredLanguage = preferredLanguage; }

    public String getCallTone() { return callTone; }
    public void setCallTone(String callTone) { this.callTone = callTone; }

    public String getAgentName() { return agentName; }
    public void setAgentName(String agentName) { this.agentName = agentName; }

    public String getAgentVoice() { return agentVoice; }
    public void setAgentVoice(String agentVoice) { this.agentVoice = agentVoice; }

    public String getCallObjective() { return callObjective; }
    public void setCallObjective(String callObjective) { this.callObjective = callObjective; }

    public String getQualificationQuestions() { return qualificationQuestions; }
    public void setQualificationQuestions(String qualificationQuestions) { this.qualificationQuestions = qualificationQuestions; }

    public String getAgentGuardrails() { return agentGuardrails; }
    public void setAgentGuardrails(String agentGuardrails) { this.agentGuardrails = agentGuardrails; }

    public String getObjectionPlaybook() { return objectionPlaybook; }
    public void setObjectionPlaybook(String objectionPlaybook) { this.objectionPlaybook = objectionPlaybook; }

    public String getProductsServices() { return productsServices; }
    public void setProductsServices(String productsServices) { this.productsServices = productsServices; }

    public String getTargetAudience() { return targetAudience; }
    public void setTargetAudience(String targetAudience) { this.targetAudience = targetAudience; }

    public String getSalesGoal() { return salesGoal; }
    public void setSalesGoal(String salesGoal) { this.salesGoal = salesGoal; }

    public String getCommonFaqs() { return commonFaqs; }
    public void setCommonFaqs(String commonFaqs) { this.commonFaqs = commonFaqs; }

    public String getPricingInfo() { return pricingInfo; }
    public void setPricingInfo(String pricingInfo) { this.pricingInfo = pricingInfo; }

    public boolean isSetupComplete() { return setupComplete; }
    public void setSetupComplete(boolean setupComplete) { this.setupComplete = setupComplete; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}

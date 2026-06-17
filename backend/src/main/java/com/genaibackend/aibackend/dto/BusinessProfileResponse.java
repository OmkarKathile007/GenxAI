package com.genaibackend.aibackend.dto;

import com.genaibackend.aibackend.entity.Business;

import java.time.LocalDateTime;

public class BusinessProfileResponse {

    private String id;
    private String businessName;
    private String industry;
    private String website;
    private String location;
    private String timezone;
    private String workingHours;
    private String productsServices;
    private String targetAudience;
    private String salesGoal;
    private String commonFaqs;
    private String pricingInfo;
    private String preferredLanguage;
    private String callTone;
    private String agentName;
    private String agentVoice;
    private String callObjective;
    private String qualificationQuestions;
    private String agentGuardrails;
    private String objectionPlaybook;
    private boolean setupComplete;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static BusinessProfileResponse from(Business business) {
        BusinessProfileResponse response = new BusinessProfileResponse();
        response.setId(business.getId());
        response.setBusinessName(business.getBusinessName());
        response.setIndustry(business.getIndustry());
        response.setWebsite(business.getWebsite());
        response.setLocation(business.getLocation());
        response.setTimezone(business.getTimezone());
        response.setWorkingHours(business.getWorkingHours());
        response.setProductsServices(business.getProductsServices());
        response.setTargetAudience(business.getTargetAudience());
        response.setSalesGoal(business.getSalesGoal());
        response.setCommonFaqs(business.getCommonFaqs());
        response.setPricingInfo(business.getPricingInfo());
        response.setPreferredLanguage(business.getPreferredLanguage());
        response.setCallTone(business.getCallTone());
        response.setAgentName(business.getAgentName());
        response.setAgentVoice(business.getAgentVoice());
        response.setCallObjective(business.getCallObjective());
        response.setQualificationQuestions(business.getQualificationQuestions());
        response.setAgentGuardrails(business.getAgentGuardrails());
        response.setObjectionPlaybook(business.getObjectionPlaybook());
        response.setSetupComplete(business.isSetupComplete());
        response.setCreatedAt(business.getCreatedAt());
        response.setUpdatedAt(business.getUpdatedAt());
        return response;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

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

    public boolean isSetupComplete() { return setupComplete; }
    public void setSetupComplete(boolean setupComplete) { this.setupComplete = setupComplete; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}

package com.genaibackend.aibackend.dto;

public class BusinessProfileRequest {

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
}

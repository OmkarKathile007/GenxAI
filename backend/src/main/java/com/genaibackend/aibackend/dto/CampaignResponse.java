package com.genaibackend.aibackend.dto;

import com.genaibackend.aibackend.entity.Campaign;

import java.time.LocalDateTime;

public class CampaignResponse {

    private String id;
    private String name;
    private String productService;
    private String targetAudience;
    private String goal;
    private String offer;
    private String channel;
    private String budget;
    private String timeline;
    private String plan;
    private LocalDateTime createdAt;

    public static CampaignResponse from(Campaign c) {
        CampaignResponse r = new CampaignResponse();
        r.id = c.getId();
        r.name = c.getName();
        r.productService = c.getProductService();
        r.targetAudience = c.getTargetAudience();
        r.goal = c.getGoal();
        r.offer = c.getOffer();
        r.channel = c.getChannel();
        r.budget = c.getBudget();
        r.timeline = c.getTimeline();
        r.plan = c.getPlan();
        r.createdAt = c.getCreatedAt();
        return r;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getProductService() { return productService; }
    public void setProductService(String productService) { this.productService = productService; }

    public String getTargetAudience() { return targetAudience; }
    public void setTargetAudience(String targetAudience) { this.targetAudience = targetAudience; }

    public String getGoal() { return goal; }
    public void setGoal(String goal) { this.goal = goal; }

    public String getOffer() { return offer; }
    public void setOffer(String offer) { this.offer = offer; }

    public String getChannel() { return channel; }
    public void setChannel(String channel) { this.channel = channel; }

    public String getBudget() { return budget; }
    public void setBudget(String budget) { this.budget = budget; }

    public String getTimeline() { return timeline; }
    public void setTimeline(String timeline) { this.timeline = timeline; }

    public String getPlan() { return plan; }
    public void setPlan(String plan) { this.plan = plan; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}

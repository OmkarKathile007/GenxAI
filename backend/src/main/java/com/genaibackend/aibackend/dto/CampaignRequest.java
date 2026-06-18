package com.genaibackend.aibackend.dto;

/** Inputs for generating an AI campaign strategy plan. */
public class CampaignRequest {

    private String name;
    private String productService;
    private String targetAudience;
    private String goal;
    private String offer;
    private String channel;
    private String budget;
    private String timeline;

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
}

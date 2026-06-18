package com.genaibackend.aibackend.service;

import com.genaibackend.aibackend.dto.CampaignRequest;
import com.genaibackend.aibackend.entity.Business;
import com.genaibackend.aibackend.entity.Campaign;
import com.genaibackend.aibackend.model.User;
import com.genaibackend.aibackend.repository.BusinessRepository;
import com.genaibackend.aibackend.repository.CampaignRepository;
import com.genaibackend.aibackend.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * The repurposed "Roadmap Generator": turns a campaign brief (offer, audience,
 * goal, channels, budget) plus the business profile into a concrete, AI-written
 * sales/marketing campaign strategy, and persists it.
 */
@Service
public class CampaignService {

    private final CampaignRepository campaignRepository;
    private final BusinessRepository businessRepository;
    private final UserRepository userRepository;
    private final AIService aiService;

    public CampaignService(CampaignRepository campaignRepository,
                           BusinessRepository businessRepository,
                           UserRepository userRepository,
                           AIService aiService) {
        this.campaignRepository = campaignRepository;
        this.businessRepository = businessRepository;
        this.userRepository = userRepository;
        this.aiService = aiService;
    }

    @Transactional(readOnly = true)
    public List<Campaign> list(String username) {
        return campaignRepository.findByOwnerUsernameOrderByCreatedAtDesc(username);
    }

    @Transactional
    public Campaign generate(String username, CampaignRequest req) {
        if (req.getName() == null || req.getName().isBlank()) {
            throw new RuntimeException("Give the campaign a name.");
        }
        User owner = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"));
        Business business = businessRepository
                .findFirstByOwnerUsernameOrderByCreatedAtDesc(username).orElse(null);

        String plan = cleanup(aiService.generateText(buildPrompt(business, req)));

        Campaign campaign = new Campaign();
        campaign.setOwner(owner);
        campaign.setName(req.getName().trim());
        campaign.setProductService(trimToNull(req.getProductService()));
        campaign.setTargetAudience(trimToNull(req.getTargetAudience()));
        campaign.setGoal(trimToNull(req.getGoal()));
        campaign.setOffer(trimToNull(req.getOffer()));
        campaign.setChannel(trimToNull(req.getChannel()));
        campaign.setBudget(trimToNull(req.getBudget()));
        campaign.setTimeline(trimToNull(req.getTimeline()));
        campaign.setPlan(plan);
        return campaignRepository.save(campaign);
    }

    @Transactional
    public Campaign updatePlan(String username, String id, String plan) {
        Campaign c = owned(username, id);
        c.setPlan(plan);
        return campaignRepository.save(c);
    }

    @Transactional
    public void delete(String username, String id) {
        campaignRepository.delete(owned(username, id));
    }

    private Campaign owned(String username, String id) {
        Campaign c = campaignRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Campaign not found"));
        if (c.getOwner() == null || !username.equals(c.getOwner().getUsername())) {
            throw new RuntimeException("Campaign not found");
        }
        return c;
    }

    // ---- helpers ----

    private String buildPrompt(Business business, CampaignRequest req) {
        String biz = business != null && notBlank(business.getBusinessName())
                ? business.getBusinessName().trim() : "the business";

        StringBuilder p = new StringBuilder();
        p.append("You are a senior B2B/B2C sales & marketing strategist. Create a concrete, actionable ")
                .append("voice-outreach campaign strategy for ").append(biz).append(".\n\n");

        p.append("BUSINESS CONTEXT (use only these facts — never invent details):\n");
        if (business != null) {
            appendLine(p, "Industry", business.getIndustry());
            appendLine(p, "What we offer", business.getProductsServices());
            appendLine(p, "Usual target customers", business.getTargetAudience());
            appendLine(p, "Pricing notes", business.getPricingInfo());
            appendLine(p, "Sales goal", business.getSalesGoal());
        }

        p.append("\nCAMPAIGN BRIEF:\n");
        appendLine(p, "Campaign name", req.getName());
        appendLine(p, "Product/service to promote", req.getProductService());
        appendLine(p, "Target audience", req.getTargetAudience());
        appendLine(p, "Primary goal", req.getGoal());
        appendLine(p, "Offer/hook", req.getOffer());
        appendLine(p, "Channels", req.getChannel());
        appendLine(p, "Budget", req.getBudget());
        appendLine(p, "Timeline", req.getTimeline());

        p.append("\nBuild a focused 7-DAY EXECUTION PLAN designed to MAXIMIZE SALES REVENUE from this campaign.\n");
        p.append("Each day must have a punchy title, a one-line revenue focus, and 3-5 concrete, actionable to-do tasks ")
                .append("(specific actions the team can check off — not vague advice).\n\n");

        p.append("Return ONLY valid JSON (no markdown, no code fences, no commentary) in EXACTLY this shape:\n");
        p.append("{\n");
        p.append("  \"summary\": \"one or two sentences on the overall revenue strategy\",\n");
        p.append("  \"northStarMetric\": \"the single KPI that proves the campaign is making money\",\n");
        p.append("  \"days\": [\n");
        p.append("    { \"day\": 1, \"title\": \"short day theme\", \"focus\": \"one-line revenue goal for the day\", ")
                .append("\"todos\": [\"task 1\", \"task 2\", \"task 3\"] }\n");
        p.append("  ]\n");
        p.append("}\n\n");

        p.append("RULES:\n");
        p.append("- The \"days\" array MUST contain exactly 7 entries (day 1 through 7).\n");
        p.append("- Every task must be specific and revenue-oriented (calls to make, segments to target, offers to push, ")
                .append("follow-ups to send, objections to counter, conversions to close).\n");
        p.append("- Tie tasks to this business's actual offer and audience; do not invent prices, discounts, or facts.\n");
        p.append("- Keep each task under 18 words.\n");
        p.append("- Output raw JSON only.");
        return p.toString();
    }

    private void appendLine(StringBuilder p, String label, String value) {
        if (notBlank(value)) p.append("- ").append(label).append(": ").append(value.trim()).append("\n");
    }

    /** Strip ```json code fences the model sometimes wraps JSON in. */
    private String cleanup(String s) {
        if (s == null) return "";
        String t = s.trim();
        if (t.startsWith("```")) {
            int firstNewline = t.indexOf('\n');
            if (firstNewline >= 0) t = t.substring(firstNewline + 1);
            if (t.endsWith("```")) t = t.substring(0, t.length() - 3);
        }
        return t.trim();
    }

    private String trimToNull(String value) {
        return (value == null || value.isBlank()) ? null : value.trim();
    }

    private boolean notBlank(String s) { return s != null && !s.isBlank(); }
}

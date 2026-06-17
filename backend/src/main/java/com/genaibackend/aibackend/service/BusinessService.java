package com.genaibackend.aibackend.service;

import com.genaibackend.aibackend.dto.BusinessProfileRequest;
import com.genaibackend.aibackend.dto.BusinessProfileResponse;
import com.genaibackend.aibackend.entity.Business;
import com.genaibackend.aibackend.model.User;
import com.genaibackend.aibackend.repository.BusinessRepository;
import com.genaibackend.aibackend.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class BusinessService {

    private final BusinessRepository businessRepository;
    private final UserRepository userRepository;
    private final AIService aiService;

    public BusinessService(BusinessRepository businessRepository, UserRepository userRepository,
                           AIService aiService) {
        this.businessRepository = businessRepository;
        this.userRepository = userRepository;
        this.aiService = aiService;
    }

    @Transactional(readOnly = true)
    public Optional<BusinessProfileResponse> getCurrentBusinessProfile(String username) {
        return businessRepository.findFirstByOwnerUsernameOrderByCreatedAtDesc(username)
                .map(BusinessProfileResponse::from);
    }

    @Transactional
    public BusinessProfileResponse saveCurrentBusinessProfile(String username, BusinessProfileRequest request) {
        if (request.getBusinessName() == null || request.getBusinessName().isBlank()) {
            throw new RuntimeException("Business name is required");
        }

        User owner = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"));

        Business business = businessRepository.findFirstByOwnerUsernameOrderByCreatedAtDesc(username)
                .orElseGet(Business::new);

        business.setOwner(owner);
        business.setBusinessName(request.getBusinessName().trim());
        business.setIndustry(trimToNull(request.getIndustry()));
        business.setWebsite(trimToNull(request.getWebsite()));
        business.setLocation(trimToNull(request.getLocation()));
        business.setTimezone(trimToNull(request.getTimezone()));
        business.setWorkingHours(trimToNull(request.getWorkingHours()));
        business.setProductsServices(trimToNull(request.getProductsServices()));
        business.setTargetAudience(trimToNull(request.getTargetAudience()));
        business.setSalesGoal(trimToNull(request.getSalesGoal()));
        business.setCommonFaqs(trimToNull(request.getCommonFaqs()));
        business.setPricingInfo(trimToNull(request.getPricingInfo()));
        business.setPreferredLanguage(trimToNull(request.getPreferredLanguage()));
        business.setCallTone(trimToNull(request.getCallTone()));
        business.setAgentName(trimToNull(request.getAgentName()));
        business.setAgentVoice(trimToNull(request.getAgentVoice()));
        business.setCallObjective(trimToNull(request.getCallObjective()));
        business.setQualificationQuestions(trimToNull(request.getQualificationQuestions()));
        business.setAgentGuardrails(trimToNull(request.getAgentGuardrails()));
        if (request.getObjectionPlaybook() != null) {
            business.setObjectionPlaybook(trimToNull(request.getObjectionPlaybook()));
        }
        business.setSetupComplete(true);

        return BusinessProfileResponse.from(businessRepository.save(business));
    }

    /**
     * "Accurate Response" tool, repurposed as the Objection Brain: from the
     * business profile, generate a concise objection-handling playbook the voice
     * agent uses live during calls. Saved on the business and injected into every
     * call's system prompt.
     */
    @Transactional
    public BusinessProfileResponse generateObjectionPlaybook(String username) {
        Business business = businessRepository.findFirstByOwnerUsernameOrderByCreatedAtDesc(username)
                .orElseThrow(() -> new RuntimeException("Set up your business profile first."));

        StringBuilder p = new StringBuilder();
        p.append("You are a sales enablement expert. Create a concise objection-handling playbook ")
                .append("for an AI voice agent calling leads on behalf of ")
                .append(orDefault(business.getBusinessName(), "this business")).append(".\n\n");
        p.append("BUSINESS CONTEXT (use only these facts — never invent details):\n");
        appendLine(p, "Industry", business.getIndustry());
        appendLine(p, "What we offer", business.getProductsServices());
        appendLine(p, "Target customers", business.getTargetAudience());
        appendLine(p, "Pricing notes", business.getPricingInfo());
        appendLine(p, "Common questions", business.getCommonFaqs());
        appendLine(p, "Sales goal", business.getSalesGoal());
        p.append("\nINSTRUCTIONS:\n");
        p.append("- List the 5-7 most likely objections a lead would raise (price, timing, trust, ")
                .append("need, already have a provider, etc.).\n");
        p.append("- For each, give a short, warm, spoken-style rebuttal (1-2 sentences) grounded in the facts above.\n");
        p.append("- Format as: \"Objection: ...\" on one line, then \"Response: ...\" on the next.\n");
        p.append("- Do not invent prices, discounts, guarantees, or facts not given above.\n");
        p.append("- Keep the whole thing under 250 words and easy for an agent to follow mid-call.\n");
        p.append("\nReturn ONLY the playbook text, no preamble or explanation.");

        String playbook = cleanup(aiService.generateText(p.toString()));
        business.setObjectionPlaybook(playbook);
        return BusinessProfileResponse.from(businessRepository.save(business));
    }

    private void appendLine(StringBuilder p, String label, String value) {
        if (value != null && !value.isBlank()) p.append("- ").append(label).append(": ").append(value.trim()).append("\n");
    }

    private String orDefault(String value, String fallback) {
        return (value != null && !value.isBlank()) ? value.trim() : fallback;
    }

    private String cleanup(String s) {
        if (s == null) return "";
        String t = s.trim();
        if (t.length() >= 2 && ((t.startsWith("\"") && t.endsWith("\"")) || (t.startsWith("'") && t.endsWith("'")))) {
            t = t.substring(1, t.length() - 1).trim();
        }
        return t;
    }

    private String trimToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}

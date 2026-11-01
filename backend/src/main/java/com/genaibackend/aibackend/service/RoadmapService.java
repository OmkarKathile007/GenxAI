package com.genaibackend.aibackend.service;

import com.genaibackend.aibackend.entity.Roadmap;
import com.genaibackend.aibackend.model.User;
import com.genaibackend.aibackend.repository.OrganizationRepository;
import com.genaibackend.aibackend.repository.RoadmapRepository;
import com.genaibackend.aibackend.repository.UserRepository;
import com.genaibackend.aibackend.tenant.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class RoadmapService {

    private final RoadmapRepository roadmapRepository;
    private final UserRepository userRepository;
    private final OrganizationRepository organizationRepository;
    private final TenantContext tenantContext;

    public RoadmapService(RoadmapRepository roadmapRepository,
                          UserRepository userRepository,
                          OrganizationRepository organizationRepository,
                          TenantContext tenantContext) {
        this.roadmapRepository = roadmapRepository;
        this.userRepository = userRepository;
        this.organizationRepository = organizationRepository;
        this.tenantContext = tenantContext;
    }

    // Create a new Roadmap from the AI response
    @Transactional
    public Roadmap createRoadmap(String username, String title, String jsonContent) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Roadmap roadmap = new Roadmap();
        roadmap.setTitle(title);
        roadmap.setRoadmapJson(jsonContent);
        roadmap.setUser(user);
        roadmap.setOrganization(
                organizationRepository.getReferenceById(tenantContext.requireOrganizationId()));

        return roadmapRepository.save(roadmap);
    }

    /**
     * Update progress (when a user checks a box).
     *
     * <p>Scoping is done by the query rather than by loading the row and then
     * comparing owners, so there is no path that fetches first and forgets to
     * check.
     */
    @Transactional
    public Roadmap updateRoadmap(String username, String roadmapId, String updatedJson) {
        Roadmap roadmap = roadmapRepository
                .findByIdAndOrganizationId(roadmapId, tenantContext.requireOrganizationId())
                .orElseThrow(() -> new RuntimeException("Roadmap not found"));

        roadmap.setRoadmapJson(updatedJson);
        return roadmapRepository.save(roadmap);
    }

    // Get all roadmaps for the current organization
    @Transactional(readOnly = true)
    public List<Roadmap> getUserRoadmaps(String username) {
        return roadmapRepository.findByOrganizationIdOrderByCreatedAtDesc(
                tenantContext.requireOrganizationId());
    }
}

package com.genaibackend.aibackend.service;

import com.genaibackend.aibackend.entity.Roadmap;
import com.genaibackend.aibackend.model.User;
import com.genaibackend.aibackend.repository.RoadmapRepository;
import com.genaibackend.aibackend.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class RoadmapService {

    private final RoadmapRepository roadmapRepository;
    private final UserRepository userRepository;

    public RoadmapService(RoadmapRepository roadmapRepository, UserRepository userRepository) {
        this.roadmapRepository = roadmapRepository;
        this.userRepository = userRepository;
    }

    // Create a new Roadmap from the AI response
    public Roadmap createRoadmap(String username, String title, String jsonContent) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Roadmap roadmap = new Roadmap();
        roadmap.setTitle(title);
        roadmap.setRoadmapJson(jsonContent);
        roadmap.setUser(user);

        return roadmapRepository.save(roadmap);
    }

    // Update progress (When user checks a box)
    public Roadmap updateRoadmap(String username, String roadmapId, String updatedJson) {
        Roadmap roadmap = roadmapRepository.findById(roadmapId)
                .orElseThrow(() -> new RuntimeException("Roadmap not found"));

        // Ownership check: a user may only modify their own roadmap.
        if (roadmap.getUser() == null || !username.equals(roadmap.getUser().getUsername())) {
            throw new RuntimeException("Roadmap not found");
        }

        roadmap.setRoadmapJson(updatedJson);
        return roadmapRepository.save(roadmap);
    }

    // Get all roadmaps for the logged-in user
    public List<Roadmap> getUserRoadmaps(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return roadmapRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
    }
}
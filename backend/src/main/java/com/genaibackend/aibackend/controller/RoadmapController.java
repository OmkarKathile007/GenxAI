package com.genaibackend.aibackend.controller;

import com.genaibackend.aibackend.entity.Roadmap;
import com.genaibackend.aibackend.service.RoadmapService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/roadmaps")
@CrossOrigin 
public class RoadmapController {

    private final RoadmapService roadmapService;

    public RoadmapController(RoadmapService roadmapService) {
        this.roadmapService = roadmapService;
    }

    // SAVE: Call this after AI finishes generating to save it permanently
    @PostMapping("/save")
    public ResponseEntity<Roadmap> saveRoadmap(
            @RequestBody Map<String, String> payload,
            Authentication authentication
    ) {
        String title = payload.get("title");
        String json = payload.get("roadmapJson");
        String username = authentication.getName();

        return ResponseEntity.ok(roadmapService.createRoadmap(username, title, json));
    }

    //  UPDATE: Call this whenever a user checks a box 
    @PutMapping("/{id}")
    public ResponseEntity<Roadmap> updateProgress(
            @PathVariable String id,
            @RequestBody Map<String, String> payload,
            Authentication authentication
    ) {
        // We only need the JSON string from the frontend
        return ResponseEntity.ok(
                roadmapService.updateRoadmap(authentication.getName(), id, payload.get("roadmapJson")));
    }

    //  LIST: Get all saved roadmaps for the user
    @GetMapping("/my-roadmaps")
    public ResponseEntity<List<Roadmap>> getMyRoadmaps(Authentication authentication) {
        return ResponseEntity.ok(roadmapService.getUserRoadmaps(authentication.getName()));
    }
}
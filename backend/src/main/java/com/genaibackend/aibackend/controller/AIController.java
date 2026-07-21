package com.genaibackend.aibackend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.genaibackend.aibackend.entity.Job;
import com.genaibackend.aibackend.service.JobService;
import com.genaibackend.aibackend.service.JobWorker;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

// No @CrossOrigin here — allowed origins are governed centrally by the
// CorsConfigurationSource in SecurityConfig. A bare @CrossOrigin would declare
// "allow any origin" and conflict with it.
@RestController
@RequestMapping("/api/ai")
public class AIController {

    private final JobService jobService;
    private final JobWorker jobWorker;
    private final ObjectMapper objectMapper;

    // Inject JobWorker in the constructor
    public AIController(JobService jobService, JobWorker jobWorker, ObjectMapper objectMapper) {
        this.jobService = jobService;
        this.jobWorker = jobWorker;
        this.objectMapper = objectMapper;
    }

    // HELPER METHOD (DRY Principle)
    // Handles creating the job AND triggering the worker instantly
    private ResponseEntity<Map<String, String>> createAndTriggerJob(Authentication auth, String toolName,
                                                                    Map<String, Object> payload) {
        try {
            //  Convert Payload to JSON String
            String jsonInput = objectMapper.writeValueAsString(payload);

            //  Create Job in Database (Status: PENDING), owned by the caller
            String jobId = jobService.createJob(auth.getName(), toolName, jsonInput);

            //  EVENT TRIGGER: Wake up the worker immediately! (No waiting 2s)
            jobWorker.triggerJobProcessing();

            //  Return Job ID to client
            return ResponseEntity.accepted().body(Map.of(
                    "jobId", jobId,
                    "status", "CREATED",
                    "message", "Request queued. Poll /api/ai/job/" + jobId
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    //  ENDPOINTS

    @PostMapping("/roadmap")
    public ResponseEntity<Map<String, String>> generateRoadmap(Authentication auth, @RequestBody Map<String, Object> payload) {
        return createAndTriggerJob(auth, "roadmap", payload);
    }

    @PostMapping("/summarize")
    public ResponseEntity<Map<String, String>> summarizeText(Authentication auth, @RequestBody Map<String, Object> payload) {
        return createAndTriggerJob(auth, "summarizer", payload);
    }

    @PostMapping("/convert")
    public ResponseEntity<Map<String, String>> convertCode(Authentication auth, @RequestBody Map<String, Object> payload) {
        return createAndTriggerJob(auth, "converter", payload);
    }

    @PostMapping("/email")
    public ResponseEntity<Map<String, String>> generateEmail(Authentication auth, @RequestBody Map<String, Object> payload) {
        return createAndTriggerJob(auth, "email", payload);
    }

    @PostMapping("/letter")
    public ResponseEntity<Map<String, String>> generateLetter(Authentication auth, @RequestBody Map<String, Object> payload) {
        return createAndTriggerJob(auth, "letter", payload);
    }

    @PostMapping("/text")
    public ResponseEntity<Map<String, String>> improveText(Authentication auth, @RequestBody Map<String, Object> payload) {
        return createAndTriggerJob(auth, "improver", payload);
    }

    // STATUS CHECK ENDPOINT — scoped to the caller so a job id alone does not
    // expose another user's prompt and AI response.
    @GetMapping("/job/{jobId}")
    public ResponseEntity<Job> getJobStatus(Authentication auth, @PathVariable String jobId) {
        return ResponseEntity.ok(jobService.getOwnedJob(auth.getName(), jobId));
    }
}
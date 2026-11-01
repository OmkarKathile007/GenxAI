package com.genaibackend.aibackend.controller;

import com.genaibackend.aibackend.service.CallRecordingService;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController
public class CallRecordingController {
    private final CallRecordingService recordings;

    public CallRecordingController(CallRecordingService recordings) {
        this.recordings = recordings;
    }

    @GetMapping("/api/calls/{id}/recording")
    public ResponseEntity<Map<String, String>> recording(@PathVariable String id) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore())
                .body(Map.of("url", recordings.playbackUrl(id)));
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, String>> recordingError(ResponseStatusException e) {
        return ResponseEntity.status(e.getStatusCode()).cacheControl(CacheControl.noStore())
                .body(Map.of("message", e.getReason()));
    }
}

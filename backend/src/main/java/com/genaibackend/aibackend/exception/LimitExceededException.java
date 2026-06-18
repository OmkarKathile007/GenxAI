package com.genaibackend.aibackend.exception;

/**
 * Thrown when a user hits a free-tier hard cap (max voice calls or max AI
 * generations). Mapped to HTTP 429 by {@link GlobalExceptionHandler}.
 */
public class LimitExceededException extends RuntimeException {
    public LimitExceededException(String message) {
        super(message);
    }
}

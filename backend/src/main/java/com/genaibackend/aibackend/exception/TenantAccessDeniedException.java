package com.genaibackend.aibackend.exception;

/**
 * The caller is authenticated but may not act on the organization they asked
 * for — no membership, or not a high enough role within it.
 *
 * Maps to 403, not 400: the request was well-formed, it is the caller's
 * authority that is insufficient.
 */
public class TenantAccessDeniedException extends RuntimeException {

    public TenantAccessDeniedException(String message) {
        super(message);
    }
}

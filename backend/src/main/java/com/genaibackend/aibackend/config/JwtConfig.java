package com.genaibackend.aibackend.config;

/**
 * JwtUtil is a component-scanned {@code @Service} so Spring can inject the
 * {@code jwt.secret} property into it. Defining it manually as a {@code @Bean}
 * here would call {@code new JwtUtil()} and skip that injection, leaving the
 * signing key unset — so this class intentionally no longer declares that bean.
 */

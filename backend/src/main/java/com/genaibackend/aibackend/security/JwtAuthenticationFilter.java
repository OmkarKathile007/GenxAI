package com.genaibackend.aibackend.security;


import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    private final JwtUtil jwtUtil;
    private final CustomUserDetailsService userDetailsService;

    public JwtAuthenticationFilter(JwtUtil jwtUtil, CustomUserDetailsService userDetailsService) {
        this.jwtUtil = jwtUtil;
        this.userDetailsService = userDetailsService;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        //  Check if the request has an Authorization header
        final String authHeader = request.getHeader("Authorization");

        // If no header or doesn't start with "Bearer ", skip this filter
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        // Extract the token (Remove "Bearer " prefix)
        authenticate(authHeader.substring(7), request);

        //  Continue the filter chain
        filterChain.doFilter(request, response);
    }

    /**
     * Signs the request in if the token is good. A bad one (expired, signed with an
     * old key, garbled, or for a deleted user) just leaves the request anonymous.
     * This filter runs before permitAll, so throwing here would fail public routes
     * too, including the login a user with an expired token needs. Protected routes
     * still reject the anonymous request with a 401.
     */
    private void authenticate(String jwt, HttpServletRequest request) {
        try {
            String username = jwtUtil.extractUsername(jwt);

            //  If username exists AND the user is not already authenticated in this context
            if (username == null || SecurityContextHolder.getContext().getAuthentication() != null) {
                return;
            }

            // Load user details from the Database (via our custom service)
            UserDetails userDetails = this.userDetailsService.loadUserByUsername(username);

            //  Validate the token
            if (jwtUtil.isTokenValid(jwt, userDetails)) {

                //  Create an Authentication Token (The "Pass")
                // This object tells Spring Security: "This user is authenticated, here are their authorities."
                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                        userDetails,
                        null, // credentials (we don't keep the password)
                        userDetails.getAuthorities()
                );

                // Add details about the request (IP address, Session ID, etc.)
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                //  Update the SecurityContext (The "VIP List")
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        } catch (JwtException | IllegalArgumentException | UsernameNotFoundException e) {
            log.debug("Ignoring unusable token on {}: {}", request.getRequestURI(), e.getMessage());
        }
    }
}


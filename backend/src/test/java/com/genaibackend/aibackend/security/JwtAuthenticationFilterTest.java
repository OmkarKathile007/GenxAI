package com.genaibackend.aibackend.security;

import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.security.SignatureException;
import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class JwtAuthenticationFilterTest {

    private final JwtUtil jwtUtil = mock(JwtUtil.class);
    private final CustomUserDetailsService users = mock(CustomUserDetailsService.class);
    private final FilterChain chain = mock(FilterChain.class);
    private final JwtAuthenticationFilter filter = new JwtAuthenticationFilter(jwtUtil, users);

    private MockHttpServletRequest request;
    private MockHttpServletResponse response;

    @BeforeEach
    void setup() {
        SecurityContextHolder.clearContext();
        request = new MockHttpServletRequest("POST", "/auth/login");
        request.addHeader("Authorization", "Bearer some-token");
        response = new MockHttpServletResponse();
    }

    @AfterEach
    void cleanup() {
        SecurityContextHolder.clearContext();
    }

    /** A bad token must leave the request anonymous, never crash it. */
    private void assertContinuesAnonymously() throws Exception {
        filter.doFilter(request, response, chain);

        verify(chain).doFilter(any(), any());
        assertNull(SecurityContextHolder.getContext().getAuthentication());
        assertEquals(200, response.getStatus());
    }

    @Test
    void anExpiredTokenContinuesAnonymously() throws Exception {
        when(jwtUtil.extractUsername("some-token")).thenThrow(new ExpiredJwtException(null, null, "expired"));
        assertContinuesAnonymously();
    }

    @Test
    void aTokenFromAnOldSigningKeyContinuesAnonymously() throws Exception {
        when(jwtUtil.extractUsername("some-token")).thenThrow(new SignatureException("bad signature"));
        assertContinuesAnonymously();
    }

    @Test
    void aGarbledTokenContinuesAnonymously() throws Exception {
        when(jwtUtil.extractUsername("some-token")).thenThrow(new MalformedJwtException("garbled"));
        assertContinuesAnonymously();
    }

    @Test
    void anEmptyTokenContinuesAnonymously() throws Exception {
        when(jwtUtil.extractUsername("some-token")).thenThrow(new IllegalArgumentException("empty"));
        assertContinuesAnonymously();
    }

    @Test
    void aTokenForADeletedUserContinuesAnonymously() throws Exception {
        when(jwtUtil.extractUsername("some-token")).thenReturn("gone");
        when(users.loadUserByUsername("gone")).thenThrow(new UsernameNotFoundException("gone"));
        assertContinuesAnonymously();
    }

    @Test
    void aGoodTokenStillAuthenticates() throws Exception {
        var user = new User("asha", "x", List.of(new SimpleGrantedAuthority("ROLE_USER")));
        when(jwtUtil.extractUsername("some-token")).thenReturn("asha");
        when(users.loadUserByUsername("asha")).thenReturn(user);
        when(jwtUtil.isTokenValid("some-token", user)).thenReturn(true);

        filter.doFilter(request, response, chain);

        verify(chain).doFilter(any(), any());
        assertNotNull(SecurityContextHolder.getContext().getAuthentication());
        assertEquals("asha", SecurityContextHolder.getContext().getAuthentication().getName());
    }

    @Test
    void noHeaderSkipsTokenChecks() throws Exception {
        filter.doFilter(new MockHttpServletRequest("GET", "/ping"), response, chain);

        verify(jwtUtil, never()).extractUsername(any());
        verify(chain).doFilter(any(), any());
    }
}

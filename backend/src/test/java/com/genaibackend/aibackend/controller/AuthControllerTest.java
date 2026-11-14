package com.genaibackend.aibackend.controller;

import com.genaibackend.aibackend.dto.AuthResponse;
import com.genaibackend.aibackend.dto.LoginRequest;
import com.genaibackend.aibackend.service.AuthService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AuthControllerTest {

    private final AuthService auth = mock(AuthService.class);
    private final AuthController controller = new AuthController(auth, 30, true, "Lax");

    @Test
    void signingInSetsAHardenedCookie() {
        when(auth.login(any())).thenReturn(new AuthResponse("access", "refresh-value"));

        var response = controller.login(new LoginRequest());

        String cookie = response.getHeaders().getFirst(HttpHeaders.SET_COOKIE);
        assertTrue(cookie.startsWith("refresh_token=refresh-value"));
        assertTrue(cookie.contains("HttpOnly"));
        assertTrue(cookie.contains("Secure"));
        assertTrue(cookie.contains("SameSite=Lax"));
        assertTrue(cookie.contains("Path=/auth"));
        assertTrue(cookie.contains("Max-Age=2592000"));
    }

    @Test
    void theRefreshTokenNeverAppearsInTheResponseBody() throws Exception {
        String json = new ObjectMapper().writeValueAsString(new AuthResponse("access", "refresh-value"));

        assertTrue(json.contains("access"));
        assertFalse(json.contains("refresh-value"));
    }

    @Test
    void refreshRotatesTheCookie() {
        when(auth.refresh("old")).thenReturn(Optional.of(new AuthResponse("access", "new")));

        var response = controller.refresh("genxai", "old");

        assertEquals(200, response.getStatusCode().value());
        assertTrue(response.getHeaders().getFirst(HttpHeaders.SET_COOKIE).startsWith("refresh_token=new"));
    }

    @Test
    void aRefusedRefreshClearsTheCookie() {
        when(auth.refresh("dead")).thenReturn(Optional.empty());

        var response = controller.refresh("genxai", "dead");

        assertEquals(401, response.getStatusCode().value());
        assertTrue(response.getHeaders().getFirst(HttpHeaders.SET_COOKIE).contains("Max-Age=0"));
    }

    @Test
    void aForgedCrossSiteRefreshIsRefused() {
        var response = controller.refresh(null, "cookie-the-browser-attached");

        assertEquals(403, response.getStatusCode().value());
        verify(auth, never()).refresh(any());
    }

    @Test
    void aForgedCrossSiteLogoutIsRefused() {
        assertEquals(403, controller.logout(null, "cookie").getStatusCode().value());
        verify(auth, never()).logout(any());
    }

    @Test
    void logoutRevokesAndClearsTheCookie() {
        var response = controller.logout("genxai", "live");

        assertEquals(204, response.getStatusCode().value());
        verify(auth).logout("live");
        assertTrue(response.getHeaders().getFirst(HttpHeaders.SET_COOKIE).contains("Max-Age=0"));
    }
}

package com.genaibackend.aibackend.controller;

import com.genaibackend.aibackend.dto.AuthResponse;
import com.genaibackend.aibackend.dto.GoogleLoginRequest;
import com.genaibackend.aibackend.dto.LoginRequest;
import com.genaibackend.aibackend.dto.RegisterRequest;
import com.genaibackend.aibackend.service.AuthService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;

@RestController
@RequestMapping("/auth")
public class AuthController {

    static final String REFRESH_COOKIE = "refresh_token";

    /**
     * Cookies are sent automatically, even on a request forged by another site. A
     * custom header can't be: the browser would ask CORS first, and only our own
     * origins pass. So requiring it stops forged refresh and logout requests.
     */
    static final String CLIENT_HEADER = "X-Requested-With";

    private final AuthService authService;
    private final Duration refreshLifetime;
    private final boolean cookieSecure;
    private final String cookieSameSite;

    public AuthController(AuthService authService,
                          @Value("${auth.refresh.days:30}") long refreshDays,
                          @Value("${auth.cookie.secure:true}") boolean cookieSecure,
                          @Value("${auth.cookie.same-site:Lax}") String cookieSameSite) {
        this.authService = authService;
        this.refreshLifetime = Duration.ofDays(refreshDays);
        this.cookieSecure = cookieSecure;
        this.cookieSameSite = cookieSameSite;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody RegisterRequest request) {
        return signedIn(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        return signedIn(authService.login(request));
    }

    @PostMapping("/google")
    public ResponseEntity<AuthResponse> googleLogin(@RequestBody GoogleLoginRequest request) {
        return signedIn(authService.googleLogin(request));
    }

    /** Swaps the refresh cookie for a new one and a fresh login token. */
    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(
            @RequestHeader(value = CLIENT_HEADER, required = false) String clientHeader,
            @CookieValue(value = REFRESH_COOKIE, required = false) String refreshToken) {
        if (clientHeader == null || clientHeader.isBlank()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return authService.refresh(refreshToken)
                .map(this::signedIn)
                .orElseGet(() -> ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .header(HttpHeaders.SET_COOKIE, cookie("", Duration.ZERO))
                        .build());
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
            @RequestHeader(value = CLIENT_HEADER, required = false) String clientHeader,
            @CookieValue(value = REFRESH_COOKIE, required = false) String refreshToken) {
        if (clientHeader == null || clientHeader.isBlank()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        authService.logout(refreshToken);
        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, cookie("", Duration.ZERO))
                .build();
    }

    private ResponseEntity<AuthResponse> signedIn(AuthResponse response) {
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie(response.getRefreshToken(), refreshLifetime))
                .body(response);
    }

    /** httpOnly keeps it out of reach of page scripts; the path keeps it off every other request. */
    private String cookie(String value, Duration maxAge) {
        return ResponseCookie.from(REFRESH_COOKIE, value)
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite(cookieSameSite)
                .path("/auth")
                .maxAge(maxAge)
                .build()
                .toString();
    }
}

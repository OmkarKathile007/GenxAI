package com.genaibackend.aibackend.service;


import com.genaibackend.aibackend.dto.AuthResponse;
import com.genaibackend.aibackend.dto.GoogleLoginRequest;
import com.genaibackend.aibackend.dto.LoginRequest;
import com.genaibackend.aibackend.dto.RegisterRequest;
import com.genaibackend.aibackend.model.Role;
import com.genaibackend.aibackend.model.User;
import com.genaibackend.aibackend.repository.UserRepository;
import com.genaibackend.aibackend.security.JwtUtil;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.AmqpException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.Collections;
import java.util.HashSet;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;
    private final NotificationService notificationService;
    private final OrganizationService organizationService;
    private final RefreshTokenService refreshTokenService;
    private final String googleClientId;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtUtil jwtUtil,
                       AuthenticationManager authenticationManager,
                       NotificationService notificationService,
                       OrganizationService organizationService,
                       RefreshTokenService refreshTokenService,
                       @Value("${google.client-id:}") String googleClientId) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.authenticationManager = authenticationManager;
        this.notificationService = notificationService;
        this.organizationService = organizationService;
        this.refreshTokenService = refreshTokenService;
        this.googleClientId = googleClientId;
    }

    // Transactional so a user is never committed without an organization: a
    // user with no membership cannot use any tenant-scoped endpoint and would
    // need manual repair.
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        // Validation: Check if user exists
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username already exists");
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        // Roles are assigned server-side only. Never trust a client-supplied role
        // list on registration — doing so would allow privilege escalation (e.g.
        // self-registering as ADMIN). Everyone who signs up gets USER.
        Set<Role> roles = new HashSet<>();
        roles.add(Role.USER);

        //  Create User Object
        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword())); // HASH IT!
        user.setRoles(roles);

        //  Save to DB
        user = userRepository.save(user);

        // Every user needs a tenant before they can touch any org-scoped
        // endpoint. Same shape V3 backfilled for pre-existing users.
        organizationService.provisionPersonalOrganization(user);

        sendFirstLoginNotificationIfNeeded(user);

        // Sign them in immediately (so they don't have to login after register)
        return startSession(user);
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        //  Authenticate using Spring Security Manager
        // This will verify the username and password automatically
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getUsername(),
                        request.getPassword()
                )
        );

        //  If we get here, credentials are correct. Generate Token.
        // We need to fetch the UserDetails again to get the Roles for the token
        User user = userRepository.findByUsername(request.getUsername()).orElseThrow();

        // Defensive and idempotent: guarantees an org even for an account that
        // somehow predates or missed the V3 backfill, rather than letting them
        // hit a confusing 403 on their first real request.
        organizationService.provisionPersonalOrganization(user);

        // Convert to Spring UserDetails (minimal version for token)
        // In a real app, you might refactor this conversion to a shared utility method
        AuthResponse session = startSession(user);
        sendFirstLoginNotificationIfNeeded(user);

        return session;
    }

    @Transactional
    public AuthResponse googleLogin(GoogleLoginRequest request) {
        if (googleClientId == null || googleClientId.isBlank()) {
            throw new RuntimeException("Google login is not configured");
        }

        if (request.getCredential() == null || request.getCredential().isBlank()) {
            throw new RuntimeException("Google credential is required");
        }

        GoogleIdToken.Payload payload = verifyGoogleCredential(request.getCredential());
        String email = payload.getEmail();

        if (email == null || email.isBlank()) {
            throw new RuntimeException("Google account email is required");
        }

        if (!Boolean.TRUE.equals(payload.getEmailVerified())) {
            throw new RuntimeException("Google account email is not verified");
        }

        User user = userRepository.findByEmail(email).orElseGet(() -> {
            User newUser = new User();
            newUser.setUsername(email);
            newUser.setEmail(email);
            newUser.setPassword(passwordEncoder.encode(UUID.randomUUID().toString()));
            newUser.setRoles(new HashSet<>(Set.of(Role.USER)));
            return userRepository.save(newUser);
        });

        if (user.getRoles() == null || user.getRoles().isEmpty()) {
            user.setRoles(new HashSet<>(Set.of(Role.USER)));
            userRepository.save(user);
        }

        organizationService.provisionPersonalOrganization(user);
        sendFirstLoginNotificationIfNeeded(user);

        return startSession(user);
    }

    /**
     * Swaps a refresh token for a new one and a fresh login token. Empty means the
     * user must sign in again. Deliberately not wrapped in this class's own
     * transaction: revoking a stolen token's family has to commit by itself.
     */
    public Optional<AuthResponse> refresh(String refreshToken) {
        return refreshTokenService.rotate(refreshToken)
                .map(issued -> new AuthResponse(generateTokenForUser(issued.user()), issued.rawToken()));
    }

    public void logout(String refreshToken) {
        refreshTokenService.revoke(refreshToken);
    }

    private AuthResponse startSession(User user) {
        return new AuthResponse(generateTokenForUser(user), refreshTokenService.issue(user));
    }

    private void sendFirstLoginNotificationIfNeeded(User user) {
        if (user.isFirstLoginNotificationSent()) {
            return;
        }

        // A welcome email is never worth losing a signup. If the broker is down,
        // the flag stays unset and the next login tries again.
        try {
            notificationService.sendFirstLoginWelcomeEmail(user);
        } catch (AmqpException e) {
            log.warn("Welcome email not queued for user {}: {}", user.getUsername(), e.getMessage());
            return;
        }
        user.setFirstLoginNotificationSent(true);
        userRepository.save(user);
    }

    private GoogleIdToken.Payload verifyGoogleCredential(String credential) {
        GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                new NetHttpTransport(),
                GsonFactory.getDefaultInstance()
        )
                .setAudience(Collections.singletonList(googleClientId))
                .build();

        try {
            GoogleIdToken idToken = verifier.verify(credential);
            if (idToken == null) {
                throw new RuntimeException("Invalid Google credential");
            }
            return idToken.getPayload();
        } catch (GeneralSecurityException | IOException e) {
            throw new RuntimeException("Unable to verify Google credential");
        }
    }

    private String generateTokenForUser(User user) {
        UserDetails userDetails = new org.springframework.security.core.userdetails.User(
                user.getUsername(),
                user.getPassword(),
                new HashSet<>()
        );

        return jwtUtil.generateToken(userDetails);
    }
}


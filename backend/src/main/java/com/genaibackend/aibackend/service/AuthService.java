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
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.Collections;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;
    private final NotificationService notificationService;
    private final String googleClientId;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtUtil jwtUtil,
                       AuthenticationManager authenticationManager,
                       NotificationService notificationService,
                       @Value("${google.client-id:}") String googleClientId) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.authenticationManager = authenticationManager;
        this.notificationService = notificationService;
        this.googleClientId = googleClientId;
    }

    public AuthResponse register(RegisterRequest request) {
        // Validation: Check if user exists
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username already exists");
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        // Map Roles (String -> Enum)
        Set<Role> roles = new HashSet<>();
        if (request.getRoles() != null) {
            for (String role : request.getRoles()) {
                try {
                    roles.add(Role.valueOf(role.toUpperCase()));
                } catch (IllegalArgumentException e) {
                    // Ignore invalid roles or set default
                    roles.add(Role.USER);
                }
            }
        } else {
            roles.add(Role.USER); // Default role
        }

        //  Create User Object
        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword())); // HASH IT!
        user.setRoles(roles);

        //  Save to DB
        userRepository.save(user);
        sendFirstLoginNotificationIfNeeded(user);

        // Generate Token immediately (so they don't have to login after register)
        String token = generateTokenForUser(user);

        return new AuthResponse(token);
    }

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

        // Convert to Spring UserDetails (minimal version for token)
        // In a real app, you might refactor this conversion to a shared utility method
        String token = generateTokenForUser(user);
        sendFirstLoginNotificationIfNeeded(user);

        return new AuthResponse(token);
    }

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

        sendFirstLoginNotificationIfNeeded(user);

        return new AuthResponse(generateTokenForUser(user));
    }

    private void sendFirstLoginNotificationIfNeeded(User user) {
        if (user.isFirstLoginNotificationSent()) {
            return;
        }

        user.setFirstLoginNotificationSent(true);
        userRepository.save(user);
        notificationService.sendFirstLoginWelcomeEmail(user);
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


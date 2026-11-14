package com.genaibackend.aibackend.service;

import com.genaibackend.aibackend.dto.GoogleLoginRequest;
import com.genaibackend.aibackend.repository.UserRepository;
import com.genaibackend.aibackend.security.JwtUtil;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.core.env.PropertiesPropertySource;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.support.PropertiesLoaderUtils;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.io.IOException;
import java.io.UncheckedIOException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;

class GoogleAuthConfigurationTest {
    // Load the real property mapping without starting database, mail or queue clients.
    // Isolate external settings so the developer's local credentials cannot mask failures.
    private final ApplicationContextRunner runner = new ApplicationContextRunner()
            .withInitializer(context -> {
                var sources = context.getEnvironment().getPropertySources();
                sources.remove("systemEnvironment");
                sources.remove("systemProperties");
                try {
                    sources.addLast(new PropertiesPropertySource("application",
                            PropertiesLoaderUtils.loadProperties(new ClassPathResource("application.properties"))));
                } catch (IOException exception) {
                    throw new UncheckedIOException(exception);
                }
            })
            .withBean(UserRepository.class, () -> mock(UserRepository.class))
            .withBean(PasswordEncoder.class, () -> mock(PasswordEncoder.class))
            .withBean(JwtUtil.class, () -> mock(JwtUtil.class))
            .withBean(AuthenticationManager.class, () -> mock(AuthenticationManager.class))
            .withBean(NotificationService.class, () -> mock(NotificationService.class))
            .withBean(OrganizationService.class, () -> mock(OrganizationService.class))
            .withBean(RefreshTokenService.class, () -> mock(RefreshTokenService.class))
            .withUserConfiguration(AuthService.class);

    @Test
    void acceptsExistingPublicClientIdSetting() {
        runner.withPropertyValues("NEXT_PUBLIC_GOOGLE_CLIENT_ID=public.apps.googleusercontent.com")
                .run(context -> {
                    assertThat(context.getEnvironment().getProperty("google.client-id"))
                            .isEqualTo("public.apps.googleusercontent.com");
                    assertThatThrownBy(() -> context.getBean(AuthService.class).googleLogin(new GoogleLoginRequest()))
                            .hasMessage("Google credential is required");
                    verifyNoInteractions(context.getBean(UserRepository.class));
                });
    }

    @Test
    void acceptsCanonicalBackendSetting() {
        runner.withPropertyValues("GOOGLE_CLIENT_ID=backend.apps.googleusercontent.com")
                .run(context -> assertThat(context.getEnvironment().getProperty("google.client-id"))
                        .isEqualTo("backend.apps.googleusercontent.com"));
    }

    @Test
    void canonicalBackendSettingTakesPrecedence() {
        runner.withPropertyValues("GOOGLE_CLIENT_ID=backend.apps.googleusercontent.com",
                        "NEXT_PUBLIC_GOOGLE_CLIENT_ID=public.apps.googleusercontent.com")
                .run(context -> assertThat(context.getEnvironment().getProperty("google.client-id"))
                        .isEqualTo("backend.apps.googleusercontent.com"));
    }

    @Test
    void preservesDirectLocalPropertyOverride() {
        runner.withPropertyValues("google.client-id=local.apps.googleusercontent.com",
                        "GOOGLE_CLIENT_ID=backend.apps.googleusercontent.com")
                .run(context -> assertThat(context.getEnvironment().getProperty("google.client-id"))
                        .isEqualTo("local.apps.googleusercontent.com"));
    }

    @Test
    void missingConfigurationStillRejectsLoginBeforeAccessingAccounts() {
        runner.run(context -> {
            assertThatThrownBy(() -> context.getBean(AuthService.class).googleLogin(new GoogleLoginRequest()))
                    .hasMessage("Google login is not configured");
            verifyNoInteractions(context.getBean(UserRepository.class));
        });
    }
}

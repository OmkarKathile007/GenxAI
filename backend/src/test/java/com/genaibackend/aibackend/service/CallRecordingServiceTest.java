package com.genaibackend.aibackend.service;

import com.genaibackend.aibackend.entity.VoiceCall;
import com.genaibackend.aibackend.repository.VoiceCallRepository;
import com.genaibackend.aibackend.tenant.TenantContext;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.reactive.function.client.ClientResponse;
import org.springframework.web.reactive.function.client.ExchangeFunction;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Mono;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class CallRecordingServiceTest {
    private final VoiceCallRepository calls = mock(VoiceCallRepository.class);
    private final TenantContext tenant = mock(TenantContext.class);
    private final ExchangeFunction exchange = mock(ExchangeFunction.class);
    private CallRecordingService service;

    @BeforeEach
    void setup() {
        when(tenant.requireOrganizationId()).thenReturn("org-a");
        VoiceCall call = new VoiceCall();
        call.setVapiCallId("provider-call");
        when(calls.findByIdAndOrganizationId("call", "org-a")).thenReturn(Optional.of(call));
        service = new CallRecordingService(calls, tenant, WebClient.builder().exchangeFunction(exchange),
                "https://api.vapi.ai", "test-private-key");
    }

    @Test
    void retrievesFreshSignedUrlWithoutFollowingRedirect() {
        when(exchange.exchange(any())).thenAnswer(invocation -> {
            var request = (org.springframework.web.reactive.function.client.ClientRequest) invocation.getArgument(0);
            assertEquals("https://api.vapi.ai/call/provider-call/mono-recording", request.url().toString());
            assertEquals("Bearer test-private-key", request.headers().getFirst("Authorization"));
            return Mono.just(ClientResponse.create(HttpStatus.FOUND)
                    .header("Location", "https://storage.example/recording.wav?signature=fresh").build());
        });
        assertEquals("https://storage.example/recording.wav?signature=fresh", service.playbackUrl("call"));
        verify(exchange, times(1)).exchange(any());
    }

    @Test
    void preservesRedirectEvenWhenInjectedClientFollowsRedirects() {
        var server = reactor.netty.http.server.HttpServer.create().host("127.0.0.1").port(0)
                .handle((request, response) -> response.status(302)
                        .header("Location", "https://127.0.0.1:1/recording.wav?signature=fresh").send())
                .bindNow();
        try {
            var builder = WebClient.builder().clientConnector(
                    new org.springframework.http.client.reactive.ReactorClientHttpConnector(
                            reactor.netty.http.client.HttpClient.create().followRedirect(true)));
            var realService = new CallRecordingService(calls, tenant, builder,
                    "http://127.0.0.1:" + server.port(), "test-private-key");
            assertEquals("https://127.0.0.1:1/recording.wav?signature=fresh", realService.playbackUrl("call"));
        } finally {
            server.disposeNow();
        }
    }

    @Test
    void deniesCallsOutsideCurrentOrganizationBeforeContactingProvider() {
        when(calls.findByIdAndOrganizationId("other-call", "org-a")).thenReturn(Optional.empty());
        assertEquals(HttpStatus.NOT_FOUND,
                assertThrows(ResponseStatusException.class, () -> service.playbackUrl("other-call")).getStatusCode());
        verifyNoInteractions(exchange);
    }

    @Test
    void reportsUnavailableRecording() {
        when(exchange.exchange(any())).thenReturn(Mono.just(ClientResponse.create(HttpStatus.NOT_FOUND).build()));
        assertEquals(HttpStatus.NOT_FOUND,
                assertThrows(ResponseStatusException.class, () -> service.playbackUrl("call")).getStatusCode());
    }

    @Test
    void rejectsInsecureRedirect() {
        when(exchange.exchange(any())).thenReturn(Mono.just(ClientResponse.create(HttpStatus.FOUND)
                .header("Location", "http://storage.example/audio.wav").build()));
        assertEquals(HttpStatus.BAD_GATEWAY,
                assertThrows(ResponseStatusException.class, () -> service.playbackUrl("call")).getStatusCode());
    }

    @Test
    void hidesProviderErrorDetails() {
        when(exchange.exchange(any())).thenReturn(Mono.error(new RuntimeException("secret-provider-details")));
        var error = assertThrows(ResponseStatusException.class, () -> service.playbackUrl("call"));
        assertEquals(HttpStatus.BAD_GATEWAY, error.getStatusCode());
        assertFalse(error.getMessage().contains("secret-provider-details"));
    }
}

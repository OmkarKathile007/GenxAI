package com.genaibackend.aibackend.service;

import com.genaibackend.aibackend.entity.VoiceCall;
import com.genaibackend.aibackend.repository.VoiceCallRepository;
import com.genaibackend.aibackend.tenant.TenantContext;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Mono;
import reactor.netty.http.client.HttpClient;

import java.net.URI;
import java.time.Duration;

@Service
public class CallRecordingService {
    private final VoiceCallRepository calls;
    private final TenantContext tenantContext;
    private final WebClient client;
    private final String baseUrl;
    private final String privateKey;

    public CallRecordingService(VoiceCallRepository calls, TenantContext tenantContext,
                                WebClient.Builder builder,
                                @Value("${vapi.api.base-url}") String baseUrl,
                                @Value("${vapi.private.key}") String privateKey) {
        this.calls = calls;
        this.tenantContext = tenantContext;
        // Spring Boot 3.5 enables redirects on its injected builder. We need
        // the original Location header, not the downloaded audio response.
        this.client = builder.clone()
                .clientConnector(new ReactorClientHttpConnector(HttpClient.create().followRedirect(false)))
                .build();
        this.baseUrl = baseUrl;
        this.privateKey = privateKey;
    }

    /** Resolve on demand: stored bucket URLs are private and signed URLs expire. */
    public String playbackUrl(String id) {
        VoiceCall call = calls.findByIdAndOrganizationId(id, tenantContext.requireOrganizationId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Call not found."));
        if (call.getVapiCallId() == null || call.getVapiCallId().isBlank()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No recording is available for this call.");
        }
        if (privateKey == null || privateKey.isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Recording access is not configured.");
        }

        try {
            // Do not follow the redirect or forward our API key to the storage host.
            return client.get()
                    .uri(baseUrl + "/call/{id}/mono-recording", call.getVapiCallId())
                    .headers(headers -> headers.setBearerAuth(privateKey))
                    .exchangeToMono(response -> {
                        URI location = response.headers().asHttpHeaders().getLocation();
                        if (response.statusCode().is3xxRedirection() && location != null
                                && "https".equalsIgnoreCase(location.getScheme()) && location.getHost() != null) {
                            return response.releaseBody().thenReturn(location.toString());
                        }
                        boolean missing = response.statusCode().value() == 404;
                        return response.releaseBody().then(Mono.<String>error(new ResponseStatusException(
                                missing ? HttpStatus.NOT_FOUND : HttpStatus.BAD_GATEWAY,
                                missing ? "The recording is not available yet or has expired. Try again shortly."
                                        : "The recording provider could not load this recording. Please retry.")));
                    })
                    .block(Duration.ofSeconds(20));
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            // Provider errors can contain credentials or signed URLs; don't expose them.
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "Could not reach the recording provider. Please retry.");
        }
    }
}

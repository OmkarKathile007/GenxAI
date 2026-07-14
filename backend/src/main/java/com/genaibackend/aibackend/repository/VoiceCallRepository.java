package com.genaibackend.aibackend.repository;

import com.genaibackend.aibackend.entity.VoiceCall;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface VoiceCallRepository extends JpaRepository<VoiceCall, String> {

    // Fetch the contact eagerly so DTO mapping works with open-in-view disabled.
    @EntityGraph(attributePaths = "contact")
    List<VoiceCall> findByOwnerUsernameOrderByCreatedAtDesc(String username);

    @EntityGraph(attributePaths = "contact")
    List<VoiceCall> findByContactIdOrderByCreatedAtDesc(String contactId);

    // Owner-scoped variant so a user can only read calls for their own contacts.
    @EntityGraph(attributePaths = "contact")
    List<VoiceCall> findByContactIdAndOwnerUsernameOrderByCreatedAtDesc(String contactId, String username);

    Optional<VoiceCall> findByVapiCallId(String vapiCallId);
}

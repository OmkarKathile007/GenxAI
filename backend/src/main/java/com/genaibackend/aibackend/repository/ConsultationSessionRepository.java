package com.genaibackend.aibackend.repository;

import com.genaibackend.aibackend.entity.ConsultationSession;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ConsultationSessionRepository extends JpaRepository<ConsultationSession, String> {

    @EntityGraph(attributePaths = "contact")
    List<ConsultationSession> findByOwnerUsernameOrderByCreatedAtDesc(String username);

    List<ConsultationSession> findByContactIdOrderByCreatedAtDesc(String contactId);

    Optional<ConsultationSession> findByVapiCallId(String vapiCallId);
}

package com.genaibackend.aibackend.repository;

import com.genaibackend.aibackend.entity.Invite;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface InviteRepository extends JpaRepository<Invite, String> {

    // Fetch the contact eagerly so DTO mapping works with open-in-view disabled.
    @EntityGraph(attributePaths = "contact")
    List<Invite> findByOwnerUsernameOrderByCreatedAtDesc(String username);

    List<Invite> findByContactIdOrderByCreatedAtDesc(String contactId);

    Optional<Invite> findByToken(String token);
}

package com.genaibackend.aibackend.repository;

import com.genaibackend.aibackend.entity.FollowUp;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FollowUpRepository extends JpaRepository<FollowUp, String> {

    @EntityGraph(attributePaths = "contact")
    List<FollowUp> findByOwnerUsernameOrderByCreatedAtDesc(String username);
}

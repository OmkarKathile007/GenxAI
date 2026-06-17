package com.genaibackend.aibackend.repository;

import com.genaibackend.aibackend.entity.Business;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface BusinessRepository extends JpaRepository<Business, String> {

    Optional<Business> findFirstByOwnerUsernameOrderByCreatedAtDesc(String username);
}

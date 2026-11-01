package com.genaibackend.aibackend.repository;

import com.genaibackend.aibackend.entity.Campaign;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CampaignRepository extends JpaRepository<Campaign, String> {

    List<Campaign> findByOrganizationIdOrderByCreatedAtDesc(String organizationId);

    Optional<Campaign> findByIdAndOrganizationId(String id, String organizationId);
}

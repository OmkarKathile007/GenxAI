package com.genaibackend.aibackend.repository;

import com.genaibackend.aibackend.entity.Campaign;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CampaignRepository extends JpaRepository<Campaign, String> {

    List<Campaign> findByOwnerUsernameOrderByCreatedAtDesc(String username);
}

package com.genaibackend.aibackend.repository;

import com.genaibackend.aibackend.entity.Roadmap;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RoadmapRepository extends JpaRepository<Roadmap, String> {

    List<Roadmap> findByOrganizationIdOrderByCreatedAtDesc(String organizationId);

    Optional<Roadmap> findByIdAndOrganizationId(String id, String organizationId);
}

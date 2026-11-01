package com.genaibackend.aibackend.repository;

import com.genaibackend.aibackend.entity.Job;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface JobRepository extends JpaRepository<Job, String> {

    /**
     * Daily quota, now counted per ORGANIZATION rather than per user. In a B2B
     * product the allowance belongs to the account that pays for it, so five
     * teammates share one quota instead of getting five. For the single-member
     * orgs every existing user was migrated into, this is identical to the old
     * per-user behaviour.
     */
    long countByOrganizationIdAndCreatedAtAfter(String organizationId, LocalDateTime date);

    /**
     * Tenant-scoped lookup — a job holds the user's prompt and the AI's
     * response, so it must never be readable by id alone.
     */
    Optional<Job> findByIdAndOrganizationId(String id, String organizationId);

    /**
     * Worker queue drain. Deliberately NOT tenant-scoped: the background worker
     * processes every tenant's jobs and has no request context to scope by. It
     * reads the tenant off each job row.
     */
    List<Job> findByStatusOrderByCreatedAtAsc(Job.JobStatus status);
}

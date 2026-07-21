package com.genaibackend.aibackend.repository;




import com.genaibackend.aibackend.entity.Job;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;


import java.util.List;
import java.util.Optional;

@Repository
public interface JobRepository extends JpaRepository<Job, String> {

    // Per-user daily quota. Counting globally would let one user exhaust the
    // allowance for everyone on the platform.
    long countByOwnerUsernameAndCreatedAtAfter(String username, LocalDateTime date);

    // Ownership-scoped lookup — a job holds the user's prompt and the AI's
    // response, so it must never be readable by id alone.
    Optional<Job> findByIdAndOwnerUsername(String id, String username);

    List<Job> findByStatusOrderByCreatedAtAsc(Job.JobStatus status);
}

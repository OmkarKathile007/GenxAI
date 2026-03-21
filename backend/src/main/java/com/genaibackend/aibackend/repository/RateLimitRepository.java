package com.genaibackend.aibackend.repository;

import com.genaibackend.aibackend.entity.RateLimit;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RateLimitRepository extends JpaRepository<RateLimit, Long> {

    /**
     * SELECT FOR UPDATE — locks the row so two simultaneous requests
     * from the same user cannot both pass the check (race condition fix).
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT r FROM RateLimit r WHERE r.username = :username")
    Optional<RateLimit> findByUsernameWithLock(@Param("username") String username);
}
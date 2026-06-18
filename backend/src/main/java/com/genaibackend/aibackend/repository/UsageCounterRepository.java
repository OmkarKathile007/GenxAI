package com.genaibackend.aibackend.repository;

import com.genaibackend.aibackend.entity.UsageCounter;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UsageCounterRepository extends JpaRepository<UsageCounter, Long> {

    Optional<UsageCounter> findByUsername(String username);

    /** Row-level lock so concurrent requests can't both pass the cap check. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT u FROM UsageCounter u WHERE u.username = :username")
    Optional<UsageCounter> findByUsernameWithLock(@Param("username") String username);
}

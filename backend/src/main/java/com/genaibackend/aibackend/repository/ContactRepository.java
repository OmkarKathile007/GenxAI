package com.genaibackend.aibackend.repository;

import com.genaibackend.aibackend.entity.Contact;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ContactRepository extends JpaRepository<Contact, String> {

    List<Contact> findByOwnerUsernameOrderByCreatedAtDesc(String username);

    Optional<Contact> findByIdAndOwnerUsername(String id, String username);

    Optional<Contact> findByOwnerUsernameAndPhone(String username, String phone);

    long countByOwnerUsername(String username);

    long countByOwnerUsernameAndStatus(String username, String status);
}

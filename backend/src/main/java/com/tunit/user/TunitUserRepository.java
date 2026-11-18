package com.tunit.user;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface TunitUserRepository extends JpaRepository<TunitUser, UUID> {
    @org.springframework.data.jpa.repository.Query("select u from TunitUser u where lower(u.email) = :email and u.deletedAt is null")
    java.util.Optional<TunitUser> findActiveByEmail(@org.springframework.data.repository.query.Param("email") String email);
    java.util.Optional<TunitUser> findByIdAndDeletedAtIsNull(UUID id);
}

package com.tunit.user;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface TunitUserRepository extends JpaRepository<TunitUser, UUID> {
    @org.springframework.data.jpa.repository.Query("select u from TunitUser u where lower(u.email) = :email and u.deletedAt is null")
    java.util.Optional<TunitUser> findActiveByEmail(@org.springframework.data.repository.query.Param("email") String email);
    java.util.Optional<TunitUser> findByIdAndDeletedAtIsNull(UUID id);
    boolean existsByEmailIgnoreCase(String email);
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select u from TunitUser u where u.id = :id and u.deletedAt is null")
    java.util.Optional<TunitUser> findActiveForUpdate(@org.springframework.data.repository.query.Param("id") UUID id);
}

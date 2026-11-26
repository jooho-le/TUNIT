package com.tunit.connection;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface ConnectionRepository extends JpaRepository<Connection, UUID> {
    interface Parties { UUID getUserA(); UUID getUserB(); }
    @org.springframework.data.jpa.repository.Query("select c.userA.id as userA, c.userB.id as userB from Connection c where c.id = :id")
    java.util.Optional<Parties> parties(@org.springframework.data.repository.query.Param("id") UUID id);
    @org.springframework.data.jpa.repository.Query("select c from Connection c where c.userA.id = :id or c.userB.id = :id")
    org.springframework.data.domain.Page<Connection> forUser(@org.springframework.data.repository.query.Param("id") UUID id, org.springframework.data.domain.Pageable pageable);
    boolean existsByUserA_IdAndUserB_Id(UUID userAId, UUID userBId);
}

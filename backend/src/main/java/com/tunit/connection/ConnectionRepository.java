package com.tunit.connection;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface ConnectionRepository extends JpaRepository<Connection, UUID> {
    boolean existsByUserA_IdAndUserB_Id(UUID userAId, UUID userBId);
}

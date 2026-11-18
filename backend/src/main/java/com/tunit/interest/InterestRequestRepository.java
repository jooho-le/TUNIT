package com.tunit.interest;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface InterestRequestRepository extends JpaRepository<InterestRequest, UUID> {
    org.springframework.data.domain.Page<InterestRequest> findBySender_IdOrderByCreatedAtDesc(UUID senderId, org.springframework.data.domain.Pageable pageable);
    org.springframework.data.domain.Page<InterestRequest> findByRecipient_IdOrderByCreatedAtDesc(UUID recipientId, org.springframework.data.domain.Pageable pageable);
    boolean existsBySender_IdAndRecipient_IdAndStatus(UUID senderId, UUID recipientId, InterestStatus status);
}

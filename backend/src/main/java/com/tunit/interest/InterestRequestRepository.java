package com.tunit.interest;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface InterestRequestRepository extends JpaRepository<InterestRequest, UUID> {
    interface Parties { UUID getSenderId(); UUID getRecipientId(); }
    @org.springframework.data.jpa.repository.Query("select i.sender.id as senderId, i.recipient.id as recipientId from InterestRequest i where i.id = :id")
    java.util.Optional<Parties> parties(@org.springframework.data.repository.query.Param("id") UUID id);
    @org.springframework.data.jpa.repository.Query("select (count(i)>0) from InterestRequest i where i.status = com.tunit.interest.InterestStatus.PENDING and ((i.sender.id = :a and i.recipient.id = :b) or (i.sender.id = :b and i.recipient.id = :a))")
    boolean pendingBetween(@org.springframework.data.repository.query.Param("a") UUID a, @org.springframework.data.repository.query.Param("b") UUID b);
    org.springframework.data.domain.Page<InterestRequest> findBySender_IdOrderByCreatedAtDesc(UUID senderId, org.springframework.data.domain.Pageable pageable);
    org.springframework.data.domain.Page<InterestRequest> findByRecipient_IdOrderByCreatedAtDesc(UUID recipientId, org.springframework.data.domain.Pageable pageable);
    boolean existsBySender_IdAndRecipient_IdAndStatus(UUID senderId, UUID recipientId, InterestStatus status);
}

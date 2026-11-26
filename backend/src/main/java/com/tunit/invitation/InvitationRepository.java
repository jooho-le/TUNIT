package com.tunit.invitation;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface InvitationRepository extends JpaRepository<Invitation, UUID> {
    interface Parties { UUID getId(); UUID getInviterId(); }
    @org.springframework.data.jpa.repository.Query("select i.id as id, i.inviter.id as inviterId from Invitation i where i.tokenHash = :hash")
    java.util.Optional<Parties> parties(@org.springframework.data.repository.query.Param("hash") String hash);
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select i from Invitation i where i.id = :id")
    java.util.Optional<Invitation> lockById(@org.springframework.data.repository.query.Param("id") UUID id);
    java.util.Optional<Invitation> findByTokenHash(String tokenHash);
}

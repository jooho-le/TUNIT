package com.tunit.invitation;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface InvitationRepository extends JpaRepository<Invitation, UUID> {
    java.util.Optional<Invitation> findByTokenHash(String tokenHash);
}

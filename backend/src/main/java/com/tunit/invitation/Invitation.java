package com.tunit.invitation;

import com.tunit.common.persistence.UuidEntity;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;
import com.tunit.user.TunitUser;
@Entity @Table(name = "invitations")
public class Invitation extends UuidEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "inviter_id", nullable = false)
    private TunitUser inviter;
    @com.fasterxml.jackson.annotation.JsonIgnore @Column(name = "token_hash", nullable = false, length = 128)
    private String tokenHash;
    @Enumerated(EnumType.STRING) @Column(name = "status", nullable = false, length = 20)
    private InvitationStatus status;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "accepted_by")
    private TunitUser acceptedBy;
    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
    @Column(name = "completed_at", nullable = true)
    private Instant completedAt;
    protected Invitation() {}
    public Invitation(UUID id, TunitUser inviter, String tokenHash, Instant expiresAt, Instant now) {
        super(id); this.inviter = Objects.requireNonNull(inviter); this.tokenHash = Objects.requireNonNull(tokenHash);
        this.status = InvitationStatus.PENDING; this.expiresAt = Objects.requireNonNull(expiresAt); this.createdAt = Objects.requireNonNull(now);
    }
    public TunitUser getInviter() { return inviter; }
    public String getTokenHash() { return tokenHash; }
    public InvitationStatus getStatus() { return status; }
    public TunitUser getAcceptedBy() { return acceptedBy; }
    public Instant getExpiresAt() { return expiresAt; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getCompletedAt() { return completedAt; }
    public void complete(TunitUser recipient, Instant now) {
        if (status != InvitationStatus.PENDING) throw new com.tunit.common.error.BusinessException(com.tunit.common.error.ErrorCode.INVITATION_ALREADY_USED);
        if (!now.isBefore(expiresAt)) throw new com.tunit.common.error.BusinessException(com.tunit.common.error.ErrorCode.INVITATION_NOT_FOUND);
        if (recipient.getId().equals(inviter.getId())) throw new com.tunit.common.error.BusinessException(com.tunit.common.error.ErrorCode.SELF_REQUEST);
        status=InvitationStatus.COMPLETED; acceptedBy=Objects.requireNonNull(recipient); completedAt=Objects.requireNonNull(now);
    }

}

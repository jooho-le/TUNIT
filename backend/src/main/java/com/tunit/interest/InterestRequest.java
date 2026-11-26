package com.tunit.interest;

import com.tunit.common.persistence.UuidEntity;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;
import com.tunit.user.TunitUser;
@Entity @Table(name = "interest_requests")
public class InterestRequest extends UuidEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "sender_id", nullable = false)
    private TunitUser sender;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "recipient_id", nullable = false)
    private TunitUser recipient;
    @Enumerated(EnumType.STRING) @Column(name = "status", nullable = false, length = 20)
    private InterestStatus status;
    @Version @Column(name = "version", nullable = false)
    private Long version;
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
    @Column(name = "resolved_at", nullable = true)
    private Instant resolvedAt;
    protected InterestRequest() {}
    public InterestRequest(UUID id, TunitUser sender, TunitUser recipient, Instant now) {
        super(id); this.sender = Objects.requireNonNull(sender); this.recipient = Objects.requireNonNull(recipient);
        if (sender.getId().equals(recipient.getId())) throw new IllegalArgumentException("Different users are required");
        this.status = InterestStatus.PENDING; this.createdAt = this.updatedAt = Objects.requireNonNull(now);
    }
    public TunitUser getSender() { return sender; }
    public TunitUser getRecipient() { return recipient; }
    public InterestStatus getStatus() { return status; }
    public Long getVersion() { return version; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public Instant getResolvedAt() { return resolvedAt; }
    public void resolve(InterestStatus target, Instant now) {
        if (status != InterestStatus.PENDING || target == InterestStatus.PENDING)
            throw new com.tunit.common.error.BusinessException(com.tunit.common.error.ErrorCode.INVALID_STATE);
        status = Objects.requireNonNull(target); updatedAt = resolvedAt = Objects.requireNonNull(now);
    }

}

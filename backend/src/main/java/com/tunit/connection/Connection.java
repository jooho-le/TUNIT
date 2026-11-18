package com.tunit.connection;

import com.tunit.common.persistence.UuidEntity;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;
import com.tunit.user.TunitUser;
import com.tunit.interest.InterestRequest;
import com.tunit.common.persistence.UuidOrder;
@Entity @Table(name = "connections")
public class Connection extends UuidEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "user_a_id", nullable = false)
    private TunitUser userA;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "user_b_id", nullable = false)
    private TunitUser userB;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "accepted_request_id", nullable = false)
    private InterestRequest acceptedRequest;
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
    protected Connection() {}
    public Connection(UUID id, TunitUser first, TunitUser second, InterestRequest request, Instant now) {
        super(id);
        if (first.getId().equals(second.getId())) throw new IllegalArgumentException("Different users are required");
        boolean ordered = UuidOrder.compare(first.getId(), second.getId()) < 0;
        this.userA = ordered ? first : second; this.userB = ordered ? second : first;
        this.acceptedRequest = Objects.requireNonNull(request); this.createdAt = Objects.requireNonNull(now);
    }
    public TunitUser getUserA() { return userA; }
    public TunitUser getUserB() { return userB; }
    public InterestRequest getAcceptedRequest() { return acceptedRequest; }
    public Instant getCreatedAt() { return createdAt; }

}

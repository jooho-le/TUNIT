package com.tunit.taste;

import jakarta.persistence.*;
import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

@Embeddable
public class UserTrackId implements Serializable {
    private static final long serialVersionUID = 1L;
    @Column(name = "user_id", nullable = false)
    private UUID userId;
    @Column(name = "track_id", nullable = false)
    private UUID trackId;
    protected UserTrackId() {}
    public UserTrackId(UUID userId, UUID trackId) { this.userId = Objects.requireNonNull(userId); this.trackId = Objects.requireNonNull(trackId); }
    public UUID getUserId() { return userId; }
    public UUID getTrackId() { return trackId; }
    @Override public boolean equals(Object other) {
        if (this == other) return true;
        if (!(other instanceof UserTrackId value)) return false;
        return Objects.equals(userId, value.userId) && Objects.equals(trackId, value.trackId);
    }
    @Override public int hashCode() { return Objects.hash(userId, trackId); }
}

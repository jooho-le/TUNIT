package com.tunit.taste;

import jakarta.persistence.*;
import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

@Embeddable
public class UserArtistId implements Serializable {
    private static final long serialVersionUID = 1L;
    @Column(name = "user_id", nullable = false)
    private UUID userId;
    @Column(name = "artist_id", nullable = false)
    private UUID artistId;
    protected UserArtistId() {}
    public UserArtistId(UUID userId, UUID artistId) { this.userId = Objects.requireNonNull(userId); this.artistId = Objects.requireNonNull(artistId); }
    public UUID getUserId() { return userId; }
    public UUID getArtistId() { return artistId; }
    @Override public boolean equals(Object other) {
        if (this == other) return true;
        if (!(other instanceof UserArtistId value)) return false;
        return Objects.equals(userId, value.userId) && Objects.equals(artistId, value.artistId);
    }
    @Override public int hashCode() { return Objects.hash(userId, artistId); }
}

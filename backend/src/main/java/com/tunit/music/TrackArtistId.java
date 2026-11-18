package com.tunit.music;

import jakarta.persistence.*;
import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

@Embeddable
public class TrackArtistId implements Serializable {
    private static final long serialVersionUID = 1L;
    @Column(name = "track_id", nullable = false)
    private UUID trackId;
    @Column(name = "artist_id", nullable = false)
    private UUID artistId;
    protected TrackArtistId() {}
    public TrackArtistId(UUID trackId, UUID artistId) { this.trackId = Objects.requireNonNull(trackId); this.artistId = Objects.requireNonNull(artistId); }
    public UUID getTrackId() { return trackId; }
    public UUID getArtistId() { return artistId; }
    @Override public boolean equals(Object other) {
        if (this == other) return true;
        if (!(other instanceof TrackArtistId value)) return false;
        return Objects.equals(trackId, value.trackId) && Objects.equals(artistId, value.artistId);
    }
    @Override public int hashCode() { return Objects.hash(trackId, artistId); }
}

package com.tunit.music;

import jakarta.persistence.*;
import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

@Embeddable
public class TrackGenreId implements Serializable {
    private static final long serialVersionUID = 1L;
    @Column(name = "track_id", nullable = false)
    private UUID trackId;
    @Column(name = "tag_id", nullable = false)
    private UUID tagId;
    protected TrackGenreId() {}
    public TrackGenreId(UUID trackId, UUID tagId) { this.trackId = Objects.requireNonNull(trackId); this.tagId = Objects.requireNonNull(tagId); }
    public UUID getTrackId() { return trackId; }
    public UUID getTagId() { return tagId; }
    @Override public boolean equals(Object other) {
        if (this == other) return true;
        if (!(other instanceof TrackGenreId value)) return false;
        return Objects.equals(trackId, value.trackId) && Objects.equals(tagId, value.tagId);
    }
    @Override public int hashCode() { return Objects.hash(trackId, tagId); }
}

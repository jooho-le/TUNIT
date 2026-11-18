package com.tunit.music;

import jakarta.persistence.*;
import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

@Embeddable
public class ArtistGenreId implements Serializable {
    private static final long serialVersionUID = 1L;
    @Column(name = "artist_id", nullable = false)
    private UUID artistId;
    @Column(name = "tag_id", nullable = false)
    private UUID tagId;
    protected ArtistGenreId() {}
    public ArtistGenreId(UUID artistId, UUID tagId) { this.artistId = Objects.requireNonNull(artistId); this.tagId = Objects.requireNonNull(tagId); }
    public UUID getArtistId() { return artistId; }
    public UUID getTagId() { return tagId; }
    @Override public boolean equals(Object other) {
        if (this == other) return true;
        if (!(other instanceof ArtistGenreId value)) return false;
        return Objects.equals(artistId, value.artistId) && Objects.equals(tagId, value.tagId);
    }
    @Override public int hashCode() { return Objects.hash(artistId, tagId); }
}

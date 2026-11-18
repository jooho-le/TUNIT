package com.tunit.music;

import com.tunit.music.Artist;
import com.tunit.taste.TasteTag;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.Objects;

@Entity @Table(name = "artist_genres")
public class ArtistGenre {
    @EmbeddedId
    private ArtistGenreId id;
    @MapsId("artistId") @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "artist_id", nullable = false)
    private Artist artist;
    @MapsId("tagId") @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "tag_id", nullable = false)
    private TasteTag tag;

    protected ArtistGenre() {}
    public ArtistGenre(Artist artist, TasteTag tag) {
        this.artist = Objects.requireNonNull(artist); this.tag = Objects.requireNonNull(tag);
        this.id = new ArtistGenreId(artist.getId(), tag.getId());
        if (tag.getType() != com.tunit.taste.TagType.GENRE) throw new com.tunit.common.error.BusinessException(com.tunit.common.error.ErrorCode.INVALID_TAG_TYPE);
    }
    public ArtistGenreId getId() { return id; }
    public Artist getArtist() { return artist; }
    public TasteTag getTag() { return tag; }

}

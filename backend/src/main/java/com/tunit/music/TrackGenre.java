package com.tunit.music;

import com.tunit.music.Track;
import com.tunit.taste.TasteTag;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.Objects;

@Entity @Table(name = "track_genres")
public class TrackGenre {
    @EmbeddedId
    private TrackGenreId id;
    @MapsId("trackId") @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "track_id", nullable = false)
    private Track track;
    @MapsId("tagId") @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "tag_id", nullable = false)
    private TasteTag tag;

    protected TrackGenre() {}
    public TrackGenre(Track track, TasteTag tag) {
        this.track = Objects.requireNonNull(track); this.tag = Objects.requireNonNull(tag);
        this.id = new TrackGenreId(track.getId(), tag.getId());
        if (tag.getType() != com.tunit.taste.TagType.GENRE) throw new com.tunit.common.error.BusinessException(com.tunit.common.error.ErrorCode.INVALID_TAG_TYPE);
    }
    public TrackGenreId getId() { return id; }
    public Track getTrack() { return track; }
    public TasteTag getTag() { return tag; }

}

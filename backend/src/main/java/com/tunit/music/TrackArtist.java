package com.tunit.music;

import com.tunit.music.Track;
import com.tunit.music.Artist;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.Objects;

@Entity @Table(name = "track_artists")
public class TrackArtist {
    @EmbeddedId
    private TrackArtistId id;
    @MapsId("trackId") @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "track_id", nullable = false)
    private Track track;
    @MapsId("artistId") @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "artist_id", nullable = false)
    private Artist artist;

    @Enumerated(EnumType.STRING) @Column(name = "artist_role", nullable = false, length = 20)
    private ArtistRole artistRole;
    protected TrackArtist() {}
    public TrackArtist(Track track, Artist artist, ArtistRole artistRole) {
        this.track = Objects.requireNonNull(track); this.artist = Objects.requireNonNull(artist);
        this.id = new TrackArtistId(track.getId(), artist.getId());
        this.artistRole = Objects.requireNonNull(artistRole);
    }
    public TrackArtistId getId() { return id; }
    public Track getTrack() { return track; }
    public Artist getArtist() { return artist; }
    public ArtistRole getArtistRole() { return artistRole; }
}

package com.tunit.taste;

import com.tunit.user.TunitUser;
import com.tunit.music.Artist;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.Objects;

@Entity @Table(name = "user_artists")
public class UserArtist {
    @EmbeddedId
    private UserArtistId id;
    @MapsId("userId") @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "user_id", nullable = false)
    private TunitUser user;
    @MapsId("artistId") @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "artist_id", nullable = false)
    private Artist artist;

    @Column(nullable = false)
    private short weight;
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
    protected UserArtist() {}
    public UserArtist(TunitUser user, Artist artist, short weight, Instant now) {
        this.user = Objects.requireNonNull(user); this.artist = Objects.requireNonNull(artist);
        this.id = new UserArtistId(user.getId(), artist.getId());
        if (weight < 1 || weight > 5) throw new IllegalArgumentException("Weight must be between 1 and 5");
        this.weight = weight; this.createdAt = Objects.requireNonNull(now);
    }
    public UserArtistId getId() { return id; }
    public TunitUser getUser() { return user; }
    public Artist getArtist() { return artist; }
    public short getWeight() { return weight; }
    public Instant getCreatedAt() { return createdAt; }
}

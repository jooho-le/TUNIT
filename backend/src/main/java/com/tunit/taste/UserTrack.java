package com.tunit.taste;

import com.tunit.user.TunitUser;
import com.tunit.music.Track;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.Objects;

@Entity @Table(name = "user_tracks")
public class UserTrack {
    @EmbeddedId
    private UserTrackId id;
    @MapsId("userId") @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "user_id", nullable = false)
    private TunitUser user;
    @MapsId("trackId") @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "track_id", nullable = false)
    private Track track;

    @Column(nullable = false)
    private short weight;
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
    protected UserTrack() {}
    public UserTrack(TunitUser user, Track track, short weight, Instant now) {
        this.user = Objects.requireNonNull(user); this.track = Objects.requireNonNull(track);
        this.id = new UserTrackId(user.getId(), track.getId());
        if (weight < 1 || weight > 5) throw new IllegalArgumentException("Weight must be between 1 and 5");
        this.weight = weight; this.createdAt = Objects.requireNonNull(now);
    }
    public UserTrackId getId() { return id; }
    public TunitUser getUser() { return user; }
    public Track getTrack() { return track; }
    public short getWeight() { return weight; }
    public Instant getCreatedAt() { return createdAt; }
}

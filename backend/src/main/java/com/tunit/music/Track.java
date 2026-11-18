package com.tunit.music;

import com.tunit.common.persistence.UuidEntity;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

@Entity @Table(name = "tracks")
public class Track extends UuidEntity {
    @Column(name = "title", nullable = false, length = 255)
    private String title;
    @Column(name = "source", nullable = false, length = 30)
    private String source;
    @Column(name = "external_id", nullable = true, length = 255)
    private String externalId;
    @Column(name = "external_url", columnDefinition = "text")
    private String externalUrl;
    @Column(name = "artwork_url", columnDefinition = "text")
    private String artworkUrl;
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
    protected Track() {}
    public Track(UUID id, String title, String source, String externalId, String externalUrl, String artworkUrl, Instant now) {
        super(id); this.title = Objects.requireNonNull(title); this.source = Objects.requireNonNull(source);
        this.externalId = externalId; this.externalUrl = externalUrl; this.artworkUrl = artworkUrl; this.createdAt = Objects.requireNonNull(now);
    }
    public String getTitle() { return title; }
    public String getSource() { return source; }
    public String getExternalId() { return externalId; }
    public String getExternalUrl() { return externalUrl; }
    public String getArtworkUrl() { return artworkUrl; }
    public Instant getCreatedAt() { return createdAt; }

}

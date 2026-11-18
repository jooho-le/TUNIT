package com.tunit.music;

import com.tunit.common.persistence.UuidEntity;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

@Entity @Table(name = "artists")
public class Artist extends UuidEntity {
    @Column(name = "name", nullable = false, length = 200)
    private String name;
    @Column(name = "source", nullable = false, length = 30)
    private String source;
    @Column(name = "external_id", nullable = true, length = 255)
    private String externalId;
    protected Artist() {}
    public Artist(UUID id, String name, String source, String externalId) {
        super(id); this.name = Objects.requireNonNull(name); this.source = Objects.requireNonNull(source); this.externalId = externalId;
    }
    public String getName() { return name; }
    public String getSource() { return source; }
    public String getExternalId() { return externalId; }

}

package com.tunit.taste;

import com.tunit.common.persistence.UuidEntity;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

@Entity @Table(name = "taste_tags")
public class TasteTag extends UuidEntity {
    @Column(name = "name", nullable = false, length = 80)
    private String name;
    @Enumerated(EnumType.STRING) @Column(name = "type", nullable = false, length = 20)
    private TagType type;
    @Column(name = "is_active", nullable = false)
    private boolean active;
    protected TasteTag() {}
    public TasteTag(UUID id, String name, TagType type, boolean active) {
        super(id); this.name = Objects.requireNonNull(name); this.type = Objects.requireNonNull(type); this.active = active;
    }
    public String getName() { return name; }
    public TagType getType() { return type; }
    public boolean getActive() { return active; }
    public boolean isActive() { return active; }
}

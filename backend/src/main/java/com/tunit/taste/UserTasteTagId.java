package com.tunit.taste;

import jakarta.persistence.*;
import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

@Embeddable
public class UserTasteTagId implements Serializable {
    private static final long serialVersionUID = 1L;
    @Column(name = "user_id", nullable = false)
    private UUID userId;
    @Column(name = "tag_id", nullable = false)
    private UUID tagId;
    protected UserTasteTagId() {}
    public UserTasteTagId(UUID userId, UUID tagId) { this.userId = Objects.requireNonNull(userId); this.tagId = Objects.requireNonNull(tagId); }
    public UUID getUserId() { return userId; }
    public UUID getTagId() { return tagId; }
    @Override public boolean equals(Object other) {
        if (this == other) return true;
        if (!(other instanceof UserTasteTagId value)) return false;
        return Objects.equals(userId, value.userId) && Objects.equals(tagId, value.tagId);
    }
    @Override public int hashCode() { return Objects.hash(userId, tagId); }
}

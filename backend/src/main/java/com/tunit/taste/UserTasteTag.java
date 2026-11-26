package com.tunit.taste;

import com.tunit.user.TunitUser;
import com.tunit.taste.TasteTag;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.Objects;

@Entity @Table(name = "user_taste_tags")
public class UserTasteTag {
    @EmbeddedId
    private UserTasteTagId id;
    @MapsId("userId") @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "user_id", nullable = false)
    private TunitUser user;
    @MapsId("tagId") @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "tag_id", nullable = false)
    private TasteTag tag;

    @Column(nullable = false)
    private short weight;
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
    protected UserTasteTag() {}
    public UserTasteTag(TunitUser user, TasteTag tag, short weight, Instant now) {
        this.user = Objects.requireNonNull(user); this.tag = Objects.requireNonNull(tag);
        this.id = new UserTasteTagId(user.getId(), tag.getId());
        if (weight < 1 || weight > 5) throw new IllegalArgumentException("Weight must be between 1 and 5");
        this.weight = weight; this.createdAt = Objects.requireNonNull(now);
    }
    public UserTasteTagId getId() { return id; }
    public TunitUser getUser() { return user; }
    public TasteTag getTag() { return tag; }
    public short getWeight() { return weight; }
    public Instant getCreatedAt() { return createdAt; }
}

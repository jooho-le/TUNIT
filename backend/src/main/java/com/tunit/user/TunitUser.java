package com.tunit.user;

import com.tunit.common.persistence.UuidEntity;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

@Entity(name = "TunitUser") @Table(name = "users")
public class TunitUser extends UuidEntity {
    @Column(name = "email", nullable = false, length = 255)
    private String email;
    @com.fasterxml.jackson.annotation.JsonIgnore @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;
    @Column(name = "nickname", nullable = false, length = 50)
    private String nickname;
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
    @Column(name = "deleted_at", nullable = true)
    private Instant deletedAt;
    protected TunitUser() {}
    public TunitUser(UUID id, String email, String passwordHash, String nickname, Instant now) {
        super(id);
        this.email = Objects.requireNonNull(email).strip().toLowerCase(java.util.Locale.ROOT);
        this.passwordHash = Objects.requireNonNull(passwordHash);
        this.nickname = Objects.requireNonNull(nickname);
        this.createdAt = this.updatedAt = Objects.requireNonNull(now);
    }
    public String getEmail() { return email; }
    public String getPasswordHash() { return passwordHash; }
    public String getNickname() { return nickname; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public Instant getDeletedAt() { return deletedAt; }
    public void rename(String nickname,Instant now) { this.nickname=Objects.requireNonNull(nickname); this.updatedAt=Objects.requireNonNull(now); }

}

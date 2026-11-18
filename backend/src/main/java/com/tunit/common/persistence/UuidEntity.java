package com.tunit.common.persistence;

import jakarta.persistence.*;
import java.util.Objects;
import java.util.UUID;

@MappedSuperclass
public abstract class UuidEntity {
    @Id @Column(nullable = false, updatable = false)
    private UUID id;
    protected UuidEntity() {}
    protected UuidEntity(UUID id) { this.id = Objects.requireNonNull(id); }
    public UUID getId() { return id; }
}

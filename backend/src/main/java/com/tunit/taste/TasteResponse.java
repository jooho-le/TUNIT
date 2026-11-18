package com.tunit.taste;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record TasteResponse(List<UUID> artistIds, List<UUID> trackIds, List<UUID> tagIds,
                            TasteStatus tasteStatus, Instant updatedAt) {
    public TasteResponse { artistIds = List.copyOf(artistIds); trackIds = List.copyOf(trackIds); tagIds = List.copyOf(tagIds); }
}

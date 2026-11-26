package com.tunit.taste;

import java.util.List;
import java.util.UUID;
import java.time.Instant;

public record TasteProfileResponse(UUID userId, TasteStatus status, String summary, List<GenreWeight> topGenres, int artistCount, int trackCount, Instant updatedAt) {}


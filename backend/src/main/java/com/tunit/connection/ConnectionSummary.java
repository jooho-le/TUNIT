package com.tunit.connection;

import java.util.UUID;
import java.time.Instant;

public record ConnectionSummary(UUID connectionId, UUID userId, String nickname, Instant createdAt) {}


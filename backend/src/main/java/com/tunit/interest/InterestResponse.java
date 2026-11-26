package com.tunit.interest;

import java.util.UUID;
import java.time.Instant;

public record InterestResponse(UUID id, UUID senderId, UUID recipientId, InterestStatus status, Instant createdAt, Instant resolvedAt) {}


package com.tunit.interest;

import java.util.UUID;
import java.time.Instant;

public record InterestActionResponse(UUID id, InterestStatus status, UUID connectionId, Instant resolvedAt) {}


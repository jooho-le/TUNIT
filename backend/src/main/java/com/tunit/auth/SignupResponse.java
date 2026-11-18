package com.tunit.auth;

import java.time.Instant;
import java.util.UUID;

public record SignupResponse(UUID id, String email, String nickname, Instant createdAt) {}

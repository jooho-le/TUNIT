package com.tunit.interest;

import java.util.UUID;
import jakarta.validation.constraints.NotNull;

public record InterestCreateRequest(@NotNull UUID recipientId) {}


package com.tunit.invitation;

public record InvitationStatusResponse(InvitationStatus status, boolean valid, boolean requiresLogin, boolean readyToCompare,
                                       String viewerRole, java.time.Instant expiresAt) {}


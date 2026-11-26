package com.tunit.invitation;

import java.time.Instant;

public record InvitationCreateResponse(String invitationUrl, Instant expiresAt, InvitationStatus status) {}


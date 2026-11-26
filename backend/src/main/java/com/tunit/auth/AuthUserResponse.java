package com.tunit.auth;

import com.tunit.taste.TasteStatus;
import java.util.UUID;

public record AuthUserResponse(UUID id, String nickname, TasteStatus tasteStatus) {}

package com.tunit.invitation;

import com.tunit.common.error.*;
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.util.*;
import org.springframework.stereotype.Component;

@Component
public class InvitationTokens {
    private final SecureRandom random = new SecureRandom();
    public String generate() { byte[] bytes=new byte[32]; random.nextBytes(bytes); return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes); }
    public String hash(String token) {
        if (token == null || !token.matches("[A-Za-z0-9_-]{43}")) throw new BusinessException(ErrorCode.INVITATION_NOT_FOUND);
        try { return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.US_ASCII))); }
        catch (NoSuchAlgorithmException exception) { throw new IllegalStateException("SHA-256 unavailable"); }
    }
}

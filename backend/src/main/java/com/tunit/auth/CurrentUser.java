package com.tunit.auth;

import com.tunit.common.error.*;
import com.tunit.user.*;
import org.springframework.stereotype.Component;

@Component
public class CurrentUser {
    private final TunitUserRepository users;
    public CurrentUser(TunitUserRepository users) { this.users = users; }
    public TunitUser read(TunitPrincipal principal) {
        if (principal == null) throw new BusinessException(ErrorCode.UNAUTHORIZED);
        return users.findByIdAndDeletedAtIsNull(principal.id()).orElseThrow(() -> new BusinessException(ErrorCode.UNAUTHORIZED));
    }
    /** Caller must hold a write transaction. All own-taste mutations lock the same user row. */
    public TunitUser lock(TunitPrincipal principal) {
        if (principal == null) throw new BusinessException(ErrorCode.UNAUTHORIZED);
        return users.findActiveForUpdate(principal.id()).orElseThrow(() -> new BusinessException(ErrorCode.UNAUTHORIZED));
    }
}

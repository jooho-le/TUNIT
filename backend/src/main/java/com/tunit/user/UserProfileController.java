package com.tunit.user;

import com.tunit.auth.*;
import com.tunit.taste.*;
import jakarta.validation.Valid;
import java.time.Clock;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

/** Preserves the existing frontend nickname editor; private settings remain a separate DTO. */
@RestController
public class UserProfileController {
    private final CurrentUser current;
    private final TunitUserRepository users;
    private final TasteProfileRepository profiles;
    private final Clock clock;
    public UserProfileController(CurrentUser current,TunitUserRepository users,TasteProfileRepository profiles,Clock clock) {
        this.current=current; this.users=users; this.profiles=profiles; this.clock=clock;
    }
    @PatchMapping("/api/v1/me/profile") @Transactional
    public AuthUserResponse nickname(@AuthenticationPrincipal TunitPrincipal p,@Valid @RequestBody NicknamePatch input) {
        var user=current.lock(p); user.rename(input.nickname(),clock.instant()); users.flush();
        return new AuthUserResponse(user.getId(),user.getNickname(),profiles.findById(user.getId()).map(TasteProfile::getStatus).orElse(TasteStatus.INCOMPLETE));
    }
}

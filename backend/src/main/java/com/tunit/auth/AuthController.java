package com.tunit.auth;

import com.tunit.common.error.*;
import com.tunit.taste.*;
import com.tunit.user.TunitUserRepository;
import jakarta.servlet.http.*;
import jakarta.validation.Valid;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.session.SessionAuthenticationStrategy;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {
    private final AuthenticationManager manager;
    private final SessionAuthenticationStrategy sessions;
    private final SecurityContextRepository contexts;
    private final TunitUserRepository users;
    private final TasteProfileRepository profiles;
    public AuthController(AuthenticationManager manager, SessionAuthenticationStrategy sessions,
                          SecurityContextRepository contexts, TunitUserRepository users, TasteProfileRepository profiles) {
        this.manager = manager; this.sessions = sessions; this.contexts = contexts; this.users = users; this.profiles = profiles;
    }
    @GetMapping("/csrf")
    public ResponseEntity<CsrfResponse> csrf(CsrfToken token) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(new CsrfResponse(token.getToken(), token.getHeaderName()));
    }
    @PostMapping(value = "/login", consumes = MediaType.APPLICATION_JSON_VALUE)
    public AuthUserResponse login(@Valid @RequestBody LoginRequest input, HttpServletRequest request, HttpServletResponse response) {
        var authentication = manager.authenticate(UsernamePasswordAuthenticationToken.unauthenticated(input.email(), input.password()));
        // Finish fallible DB reads before publishing a new authenticated session.
        var authenticatedUser = current((TunitPrincipal) authentication.getPrincipal());
        // Custom controller authentication must explicitly prevent fixation, rotate CSRF, and save its context.
        sessions.onAuthentication(authentication, request, response);
        var context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        contexts.saveContext(context, request, response);
        SecurityContextHolder.setContext(context);
        return authenticatedUser;
    }
    @GetMapping("/me")
    public AuthUserResponse me(@AuthenticationPrincipal TunitPrincipal principal) { return current(principal); }
    private AuthUserResponse current(TunitPrincipal principal) {
        if (principal == null) throw new BusinessException(ErrorCode.UNAUTHORIZED);
        var user = users.findByIdAndDeletedAtIsNull(principal.id()).orElseThrow(() -> new BusinessException(ErrorCode.UNAUTHORIZED));
        var status = profiles.findById(user.getId()).map(TasteProfile::getStatus).orElse(TasteStatus.INCOMPLETE);
        return new AuthUserResponse(user.getId(), user.getNickname(), status);
    }
}

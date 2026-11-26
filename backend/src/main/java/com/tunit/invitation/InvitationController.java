package com.tunit.invitation;

import com.tunit.auth.TunitPrincipal;
import com.tunit.match.MatchDetailResponse;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/invitations")
public class InvitationController {
    private final InvitationService service;
    public InvitationController(InvitationService service) { this.service=service; }
    @PostMapping @ResponseStatus(HttpStatus.CREATED)
    public InvitationCreateResponse create(@AuthenticationPrincipal TunitPrincipal p) { return service.create(p); }
    @GetMapping("/{token}")
    public InvitationStatusResponse status(@AuthenticationPrincipal TunitPrincipal p,@PathVariable String token) { return service.status(p,token); }
    @PostMapping("/{token}/complete")
    public InvitationStatusResponse complete(@AuthenticationPrincipal TunitPrincipal p,@PathVariable String token) { return service.complete(p,token); }
    @GetMapping("/{token}/compare")
    public MatchDetailResponse compare(@AuthenticationPrincipal TunitPrincipal p,@PathVariable String token) { return service.compare(p,token); }
}

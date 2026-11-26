package com.tunit.match;

import com.tunit.auth.TunitPrincipal;
import com.tunit.common.api.PageResponse;
import java.util.UUID;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/matches")
public class MatchingController {
    private final MatchingService service;
    public MatchingController(MatchingService service) { this.service = service; }
    @GetMapping
    public PageResponse<MatchCard> list(@AuthenticationPrincipal TunitPrincipal principal,
            @RequestParam(defaultValue="0") int page, @RequestParam(defaultValue="10") int size) { return service.list(principal,page,size); }
    @GetMapping("/{userId}")
    public MatchDetailResponse detail(@AuthenticationPrincipal TunitPrincipal principal, @PathVariable UUID userId) { return service.detail(principal,userId); }
}

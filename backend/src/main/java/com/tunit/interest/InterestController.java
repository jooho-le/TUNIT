package com.tunit.interest;

import com.tunit.auth.TunitPrincipal;
import com.tunit.common.api.PageResponse;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/interests")
public class InterestController {
    private final InterestService service;
    public InterestController(InterestService service) { this.service = service; }
    @PostMapping @ResponseStatus(HttpStatus.CREATED)
    public InterestResponse create(@AuthenticationPrincipal TunitPrincipal p, @Valid @RequestBody InterestCreateRequest input) { return service.create(p,input); }
    @GetMapping("/inbox")
    public PageResponse<InterestResponse> inbox(@AuthenticationPrincipal TunitPrincipal p, @RequestParam(defaultValue="0") int page, @RequestParam(defaultValue="20") int size) { return service.list(p,true,page,size); }
    @GetMapping("/sent")
    public PageResponse<InterestResponse> sent(@AuthenticationPrincipal TunitPrincipal p, @RequestParam(defaultValue="0") int page, @RequestParam(defaultValue="20") int size) { return service.list(p,false,page,size); }
    @PostMapping("/{id}/accept")
    public InterestActionResponse accept(@AuthenticationPrincipal TunitPrincipal p, @PathVariable UUID id) { return service.act(p,id,InterestStatus.ACCEPTED); }
    @PostMapping("/{id}/reject")
    public InterestActionResponse reject(@AuthenticationPrincipal TunitPrincipal p, @PathVariable UUID id) { return service.act(p,id,InterestStatus.REJECTED); }
    @PostMapping("/{id}/cancel")
    public InterestActionResponse cancel(@AuthenticationPrincipal TunitPrincipal p, @PathVariable UUID id) { return service.act(p,id,InterestStatus.CANCELLED); }
}

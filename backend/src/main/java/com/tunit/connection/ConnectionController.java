package com.tunit.connection;

import com.tunit.auth.TunitPrincipal;
import com.tunit.common.api.PageResponse;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/connections")
public class ConnectionController {
    private final ConnectionService service;
    public ConnectionController(ConnectionService service) { this.service=service; }
    @GetMapping
    public PageResponse<ConnectionSummary> list(@AuthenticationPrincipal TunitPrincipal p,@RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="20") int size) { return service.list(p,page,size); }
    @DeleteMapping("/{connectionId}") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal TunitPrincipal p,@PathVariable UUID connectionId) { service.delete(p,connectionId); }
}

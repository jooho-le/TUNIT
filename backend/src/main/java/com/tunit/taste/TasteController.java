package com.tunit.taste;

import com.tunit.auth.TunitPrincipal;
import jakarta.validation.Valid;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/me")
public class TasteController {
    private final TasteService service;
    public TasteController(TasteService service) { this.service = service; }
    @GetMapping("/taste")
    public TasteResponse read(@AuthenticationPrincipal TunitPrincipal user) { return service.read(user); }
    @PutMapping(value = "/taste", consumes = MediaType.APPLICATION_JSON_VALUE)
    public TasteResponse replace(@AuthenticationPrincipal TunitPrincipal user, @Valid @RequestBody TasteReplaceRequest input) {
        return service.replace(user, input);
    }
    @DeleteMapping("/taste") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void clear(@AuthenticationPrincipal TunitPrincipal user) { service.clear(user); }
    @GetMapping("/profile/settings")
    public ProfileSettings settings(@AuthenticationPrincipal TunitPrincipal user) { return service.settings(user); }
    @PatchMapping(value = "/profile/settings", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ProfileSettings patch(@AuthenticationPrincipal TunitPrincipal user, @RequestBody ProfileSettingsPatch input) {
        return service.patch(user, input);
    }
}

package com.tunit.music;

import com.tunit.auth.*;
import com.tunit.taste.*;
import java.util.List;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/catalog")
public class CatalogController {
    private final CatalogService service;
    public CatalogController(CatalogService service) { this.service = service; }
    @GetMapping("/artists")
    public com.tunit.common.api.PageResponse<ArtistSummary> artists(@AuthenticationPrincipal TunitPrincipal principal,
            @RequestParam(defaultValue = "") String q, @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
        return service.artists(principal, q, page, size);
    }
    @GetMapping("/tracks")
    public com.tunit.common.api.PageResponse<TrackSummary> tracks(@AuthenticationPrincipal TunitPrincipal principal,
            @RequestParam(defaultValue = "") String q, @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
        return service.tracks(principal, q, page, size);
    }
    @GetMapping("/tags")
    public List<TagSummary> tags(@AuthenticationPrincipal TunitPrincipal principal, @RequestParam TagType type) {
        return service.tags(principal, type);
    }
}

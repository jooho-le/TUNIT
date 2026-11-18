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
    @GetMapping("/tags")
    public List<TagSummary> tags(@AuthenticationPrincipal TunitPrincipal principal, @RequestParam TagType type) {
        return service.tags(principal, type);
    }
}

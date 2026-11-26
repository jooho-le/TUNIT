package com.tunit.discovery;

import com.tunit.auth.*;
import com.tunit.common.api.*;
import com.tunit.common.persistence.UuidOrder;
import com.tunit.music.*;
import com.tunit.taste.TasteFeatureLoader;
import java.util.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.*;
import org.springframework.web.bind.annotation.*;

@RestController
public class DiscoveryController {
    private final CurrentUser current;
    private final TasteFeatureLoader features;
    private final TrackRepository tracks;
    private final CatalogMapper catalog;
    public DiscoveryController(CurrentUser current, TasteFeatureLoader features, TrackRepository tracks, CatalogMapper catalog) {
        this.current = current; this.features = features; this.tracks = tracks; this.catalog = catalog;
    }
    @GetMapping("/api/v1/discover/tracks")
    @Transactional(readOnly = true, isolation = Isolation.REPEATABLE_READ)
    public PageResponse<TrackSummary> tracks(@AuthenticationPrincipal TunitPrincipal principal,
            @RequestParam(defaultValue="0") int page, @RequestParam(defaultValue="20") int size) {
        QueryBounds.page(page,size,org.springframework.data.domain.Sort.unsorted());
        var own = features.load(current.read(principal));
        var selected = own.trackIds();
        var available = tracks.findAll().stream().filter(t -> !selected.contains(t.getId())).map(catalog::track)
            .sorted(Comparator.<TrackSummary>comparingDouble(t -> t.genres().stream().mapToDouble(g -> own.genres().getOrDefault(g.id(),0d)).sum()).reversed()
                .thenComparing(TrackSummary::title).thenComparing(TrackSummary::id,UuidOrder::compare)).toList();
        return QueryBounds.slice(available,page,size);
    }
}

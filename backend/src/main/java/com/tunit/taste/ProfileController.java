package com.tunit.taste;

import com.tunit.auth.*;
import com.tunit.common.persistence.UuidOrder;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.*;
import org.springframework.web.bind.annotation.*;

@RestController
public class ProfileController {
    private final CurrentUser current;
    private final TasteFeatureLoader features;
    public ProfileController(CurrentUser current, TasteFeatureLoader features) { this.current = current; this.features = features; }
    @GetMapping("/api/v1/me/profile")
    @Transactional(readOnly = true, isolation = Isolation.REPEATABLE_READ)
    public TasteProfileResponse profile(@AuthenticationPrincipal TunitPrincipal principal) {
        var f = features.load(current.read(principal));
        var genres = f.genres().entrySet().stream().sorted(java.util.Map.Entry.<java.util.UUID,Double>comparingByValue().reversed()
            .thenComparing(java.util.Map.Entry::getKey, UuidOrder::compare))
            .map(e -> new GenreWeight(e.getKey(), f.genreTags().get(e.getKey()).name(), e.getValue())).toList();
        String summary = genres.isEmpty() ? null : genres.stream().limit(3).map(GenreWeight::name).collect(java.util.stream.Collectors.joining(" · ")) + "에서 찾은 나의 취향";
        return new TasteProfileResponse(f.user().getId(), f.profile().map(TasteProfile::getStatus).orElse(TasteStatus.INCOMPLETE),
            summary, genres, f.artists().size(), f.tracks().size(), f.profile().map(TasteProfile::getUpdatedAt).orElse(f.user().getUpdatedAt()));
    }
}

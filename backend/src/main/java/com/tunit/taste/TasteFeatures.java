package com.tunit.taste;

import com.tunit.music.*;
import com.tunit.user.TunitUser;
import java.util.*;

public record TasteFeatures(TunitUser user, Optional<TasteProfile> profile, List<Artist> artists, List<Track> tracks,
                            Map<UUID, Double> genres, Map<UUID, TagSummary> genreTags) {
    public boolean complete() { return profile.map(p -> p.getStatus() == TasteStatus.COMPLETE).orElse(false); }
    public boolean isPublic() { return profile.map(TasteProfile::isPublic).orElse(false); }
    public boolean consent() { return profile.map(TasteProfile::isComparisonConsent).orElse(false); }
    public Set<UUID> artistIds() { return new HashSet<>(artists.stream().map(Artist::getId).toList()); }
    public Set<UUID> trackIds() { return new HashSet<>(tracks.stream().map(Track::getId).toList()); }
}

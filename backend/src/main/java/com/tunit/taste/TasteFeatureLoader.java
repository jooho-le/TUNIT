package com.tunit.taste;

import com.tunit.music.*;
import com.tunit.user.TunitUser;
import java.util.*;
import org.springframework.stereotype.Component;

/** No writes, external lookups, persisted scores or guessed genres. Call in a transaction. */
@Component
public class TasteFeatureLoader {
    private final TasteProfileRepository profiles;
    private final UserArtistRepository artists;
    private final UserTrackRepository tracks;
    private final UserTasteTagRepository tags;
    private final CatalogMapper catalog;
    public TasteFeatureLoader(TasteProfileRepository profiles, UserArtistRepository artists, UserTrackRepository tracks,
                              UserTasteTagRepository tags, CatalogMapper catalog) {
        this.profiles = profiles; this.artists = artists; this.tracks = tracks; this.tags = tags; this.catalog = catalog;
    }
    public TasteFeatures load(TunitUser user) {
        var selectedArtists = artists.findById_UserId(user.getId());
        var selectedTracks = tracks.findById_UserId(user.getId());
        var direct = new HashMap<UUID, Double>(); var fromArtists = new HashMap<UUID, Double>(); var fromTracks = new HashMap<UUID, Double>();
        var names = new HashMap<UUID, TagSummary>();
        tags.findById_UserId(user.getId()).stream().filter(t -> t.getTag().isActive() && t.getTag().getType() == TagType.GENRE)
            .forEach(t -> add(direct, names, List.of(new TagSummary(t.getTag().getId(), t.getTag().getName(), TagType.GENRE)), t.getWeight()));
        selectedArtists.forEach(a -> add(fromArtists, names, catalog.artistGenres(a.getArtist().getId()), a.getWeight()));
        selectedTracks.forEach(t -> add(fromTracks, names, catalog.trackGenres(t.getTrack().getId()), t.getWeight()));
        var sources = List.of(direct, fromArtists, fromTracks).stream().filter(m -> !m.isEmpty()).toList();
        var distribution = new HashMap<UUID, Double>();
        for (var source : sources) {
            double total = source.values().stream().mapToDouble(Double::doubleValue).sum();
            source.forEach((id, value) -> distribution.merge(id, value / total / sources.size(), Double::sum));
        }
        return new TasteFeatures(user, profiles.findById(user.getId()), selectedArtists.stream().map(UserArtist::getArtist).toList(),
            selectedTracks.stream().map(UserTrack::getTrack).toList(), Map.copyOf(distribution), Map.copyOf(names));
    }
    private void add(Map<UUID, Double> source, Map<UUID, TagSummary> names, List<TagSummary> genres, double weight) {
        for (var tag : genres) { source.merge(tag.id(), weight / genres.size(), Double::sum); names.put(tag.id(), tag); }
    }
}

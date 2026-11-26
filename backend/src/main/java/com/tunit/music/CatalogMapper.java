package com.tunit.music;

import com.tunit.common.persistence.UuidOrder;
import com.tunit.taste.*;
import java.util.*;
import org.springframework.stereotype.Component;

/** Called within a read transaction; only reviewed metadata is projected into DTOs. */
@Component
public class CatalogMapper {
    private final ArtistGenreRepository artistGenres;
    private final TrackGenreRepository trackGenres;
    private final TrackArtistRepository participants;
    private final SafeCatalogLinks links;
    public CatalogMapper(ArtistGenreRepository artistGenres, TrackGenreRepository trackGenres,
                         TrackArtistRepository participants, SafeCatalogLinks links) {
        this.artistGenres = artistGenres; this.trackGenres = trackGenres; this.participants = participants; this.links = links;
    }
    public List<TagSummary> artistGenres(UUID id) { return tags(artistGenres.findById_ArtistId(id).stream().map(ArtistGenre::getTag).toList()); }
    public List<TagSummary> trackGenres(UUID id) { return tags(trackGenres.findById_TrackId(id).stream().map(TrackGenre::getTag).toList()); }
    private List<TagSummary> tags(List<TasteTag> values) {
        return values.stream().filter(t -> t.isActive() && t.getType() == TagType.GENRE)
            .sorted((a,b) -> UuidOrder.compare(a.getId(), b.getId()))
            .map(t -> new TagSummary(t.getId(), t.getName(), t.getType())).toList();
    }
    public ArtistSummary artist(Artist artist) { return new ArtistSummary(artist.getId(), artist.getName(), artistGenres(artist.getId())); }
    public TrackSummary track(Track track) {
        var artists = participants.findById_TrackId(track.getId()).stream()
            .sorted(Comparator.comparing(TrackArtist::getArtistRole).thenComparing(a -> a.getId().getArtistId(), UuidOrder::compare))
            .map(a -> artist(a.getArtist())).toList();
        var genres = trackGenres(track.getId());
        var artistTagIds = artists.stream().flatMap(a -> a.genres().stream()).map(TagSummary::id).collect(java.util.stream.Collectors.toSet());
        var common = genres.stream().filter(tag -> artistTagIds.contains(tag.id())).toList();
        return new TrackSummary(track.getId(), track.getTitle(), artists, genres, common,
            links.external(track.getExternalUrl()), links.artwork(track.getArtworkUrl()));
    }
}

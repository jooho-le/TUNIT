package com.tunit.music;

import com.tunit.auth.*;
import com.tunit.common.persistence.UuidOrder;
import com.tunit.taste.*;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CatalogService {
    private final CurrentUser current;
    private final TasteTagRepository tags;
    private final ArtistRepository artists;
    private final TrackRepository tracks;
    private final CatalogMapper mapper;
    public CatalogService(CurrentUser current, TasteTagRepository tags, ArtistRepository artists, TrackRepository tracks, CatalogMapper mapper) {
        this.current = current; this.tags = tags; this.artists = artists; this.tracks = tracks; this.mapper = mapper;
    }
    @Transactional(readOnly = true)
    public com.tunit.common.api.PageResponse<ArtistSummary> artists(TunitPrincipal principal, String q, int page, int size) {
        current.read(principal);
        var bounds = com.tunit.common.api.QueryBounds.page(page, size, org.springframework.data.domain.Sort.by("name", "id"));
        return com.tunit.common.api.PageResponse.from(artists.findByNameContainingIgnoreCase(com.tunit.common.api.QueryBounds.query(q), bounds).map(mapper::artist));
    }
    @Transactional(readOnly = true)
    public com.tunit.common.api.PageResponse<TrackSummary> tracks(TunitPrincipal principal, String q, int page, int size) {
        current.read(principal);
        var bounds = com.tunit.common.api.QueryBounds.page(page, size, org.springframework.data.domain.Sort.by("title", "id"));
        String term = com.tunit.common.api.QueryBounds.query(q).replace("!", "!!").replace("%", "!%").replace("_", "!_");
        return com.tunit.common.api.PageResponse.from(tracks.search("%" + term + "%", bounds).map(mapper::track));
    }
    @Transactional(readOnly = true)
    public List<TagSummary> tags(TunitPrincipal principal, TagType type) {
        current.read(principal);
        return tags.findByTypeAndActiveTrue(type).stream().sorted((a, b) -> UuidOrder.compare(a.getId(), b.getId()))
            .map(tag -> new TagSummary(tag.getId(), tag.getName(), tag.getType())).toList();
    }
}

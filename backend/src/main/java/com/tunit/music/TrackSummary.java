package com.tunit.music;

import java.util.List;
import java.util.UUID;

public record TrackSummary(UUID id, String title, List<ArtistSummary> artists, List<TagSummary> genres,
                           List<TagSummary> commonArtistGenres, String externalUrl, String artworkUrl) {}


package com.tunit.match;

import java.util.UUID;
import java.util.List;
import com.tunit.music.ArtistSummary;
import com.tunit.music.TrackSummary;
import com.tunit.music.TagSummary;

public record MatchDetailResponse(UUID userId, String nickname, Double similarityScore, List<ArtistSummary> commonArtists, List<TrackSummary> commonTracks, List<TagSummary> commonGenres, List<TrackSummary> onlyOtherTracks, String reason) {}


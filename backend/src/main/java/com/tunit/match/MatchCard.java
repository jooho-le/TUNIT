package com.tunit.match;

import java.util.UUID;
import java.util.List;
import com.tunit.music.TagSummary;

public record MatchCard(UUID userId, String nickname, Double similarityScore, SimilarityBreakdown breakdown, List<TagSummary> commonGenres, String reason) {}


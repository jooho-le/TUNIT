package com.tunit.music;

import java.util.List;
import java.util.UUID;

public record ArtistSummary(UUID id, String name, List<TagSummary> genres) {}


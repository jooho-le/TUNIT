package com.tunit.music;

import com.tunit.taste.TagType;
import java.util.UUID;

public record TagSummary(UUID id, String name, TagType type) {}

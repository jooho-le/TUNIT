package com.tunit.taste;

import jakarta.validation.constraints.NotNull;
import java.util.List;
import java.util.UUID;

public record TasteReplaceRequest(
    @NotNull(message = "아티스트 목록을 전달해 주세요.") List<@NotNull UUID> artistIds,
    @NotNull(message = "곡 목록을 전달해 주세요.") List<@NotNull UUID> trackIds,
    @NotNull(message = "태그 목록을 전달해 주세요.") List<@NotNull UUID> tagIds
) {
    public TasteReplaceRequest {
        if (artistIds != null) artistIds = List.copyOf(artistIds);
        if (trackIds != null) trackIds = List.copyOf(trackIds);
        if (tagIds != null) tagIds = List.copyOf(tagIds);
    }
}

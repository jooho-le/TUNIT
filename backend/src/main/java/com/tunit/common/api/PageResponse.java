package com.tunit.common.api;

import java.util.List;
import org.springframework.data.domain.Page;

/** No default sort or product-specific page-size ceiling is decided here. */
public record PageResponse<T>(List<T> items, int page, int size, long totalElements) {
    public PageResponse {
        items = List.copyOf(items);
        if (page < 0 || size <= 0 || totalElements < 0) throw new IllegalArgumentException("Invalid page metadata");
    }
    public static <T> PageResponse<T> from(Page<T> page) {
        return new PageResponse<>(page.getContent(), page.getNumber(), page.getSize(), page.getTotalElements());
    }
}

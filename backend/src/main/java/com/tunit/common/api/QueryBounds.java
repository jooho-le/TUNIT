package com.tunit.common.api;

import com.tunit.common.error.*;
import java.util.List;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

public final class QueryBounds {
    private QueryBounds() {}
    public static PageRequest page(int page, int size, Sort sort) {
        if (page < 0 || size < 1 || size > 50 || (long)page * size > Integer.MAX_VALUE)
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        return PageRequest.of(page, size, sort);
    }
    public static String query(String query) {
        String value = query == null ? "" : query.strip();
        if (value.codePointCount(0, value.length()) > 255) throw new BusinessException(ErrorCode.INVALID_INPUT);
        return value;
    }
    public static <T> PageResponse<T> slice(List<T> values, int page, int size) {
        page(page, size, Sort.unsorted());
        long offset = (long) page * size;
        int start = (int) Math.min(values.size(), offset);
        int end = Math.min(values.size(), start + size);
        return new PageResponse<>(values.subList(start, end), page, size, values.size());
    }
}

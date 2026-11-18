package com.tunit.common.error;

import java.time.Instant;
import java.util.List;

public record ApiErrorResponse(String code, String message, List<FieldErrorDetail> fieldErrors, Instant timestamp, String path) {
    public ApiErrorResponse { fieldErrors = List.copyOf(fieldErrors); }
    public static ApiErrorResponse of(ErrorCode code, String path, List<FieldErrorDetail> errors) {
        return new ApiErrorResponse(code.name(), code.message(), errors, Instant.now(), safePath(path));
    }
    public static ApiErrorResponse of(ErrorCode code, String path) { return of(code, path, List.of()); }
    public static String safePath(String path) {
        String withoutQuery = path.split("\\?", 2)[0];
        return withoutQuery.replaceAll("(/invitations/)[^/]+", "$1{token}");
    }
}

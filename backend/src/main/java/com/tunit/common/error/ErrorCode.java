package com.tunit.common.error;

import org.springframework.http.HttpStatus;

public enum ErrorCode {
    INVALID_INPUT(HttpStatus.BAD_REQUEST, "입력한 내용을 확인해 주세요."),
    INVALID_UUID(HttpStatus.BAD_REQUEST, "잘못된 요청입니다."),
    INVALID_TASTE_INPUT(HttpStatus.BAD_REQUEST, "선택한 음악 정보를 확인해 주세요."),
    INVALID_TAG_TYPE(HttpStatus.BAD_REQUEST, "장르 정보를 확인해 주세요."),
    SELF_REQUEST(HttpStatus.BAD_REQUEST, "본인에게는 요청할 수 없습니다."),
    INVALID_CREDENTIALS(HttpStatus.UNAUTHORIZED, "이메일 또는 비밀번호가 올바르지 않습니다."),
    UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "로그인 후 이용할 수 있습니다."),
    ACCESS_DENIED(HttpStatus.FORBIDDEN, "해당 작업을 수행할 권한이 없습니다."),
    CSRF_INVALID(HttpStatus.FORBIDDEN, "페이지를 새로고침한 후 다시 시도해 주세요."),
    RESOURCE_NOT_FOUND(HttpStatus.NOT_FOUND, "요청한 정보를 찾을 수 없습니다."),
    CATALOG_ITEM_NOT_FOUND(HttpStatus.NOT_FOUND, "선택한 음악 정보가 존재하지 않습니다."),
    INVITATION_NOT_FOUND(HttpStatus.NOT_FOUND, "유효한 초대 링크가 아닙니다."),
    METHOD_NOT_ALLOWED(HttpStatus.METHOD_NOT_ALLOWED, "허용되지 않은 요청 방식입니다."),
    UNSUPPORTED_MEDIA_TYPE(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "JSON 형식으로 요청해 주세요."),
    EMAIL_ALREADY_EXISTS(HttpStatus.CONFLICT, "이미 사용 중인 이메일입니다."),
    REQUEST_ALREADY_EXISTS(HttpStatus.CONFLICT, "이미 대기 중인 관심 요청이 있습니다."),
    ALREADY_CONNECTED(HttpStatus.CONFLICT, "이미 연결된 사용자입니다."),
    INVALID_STATE(HttpStatus.CONFLICT, "이미 처리된 요청입니다."),
    TASTE_INCOMPLETE(HttpStatus.CONFLICT, "취향 입력을 완료해 주세요."),
    CONCURRENT_MODIFICATION(HttpStatus.CONFLICT, "상태가 변경되었습니다. 새로고침해 주세요."),
    INVITATION_ALREADY_USED(HttpStatus.CONFLICT, "이미 완료된 초대입니다."),
    SERVICE_UNAVAILABLE(HttpStatus.SERVICE_UNAVAILABLE, "현재 이용할 수 없습니다. 다시 시도해 주세요."),
    INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "문제가 발생했습니다. 잠시 후 다시 시도해 주세요.");

    // INVITATION_EXPIRED (404/410) and RATE_LIMITED are deliberately unassigned.
    private final HttpStatus status;
    private final String message;
    ErrorCode(HttpStatus status, String message) { this.status = status; this.message = message; }
    public HttpStatus status() { return status; }
    public String message() { return message; }
}

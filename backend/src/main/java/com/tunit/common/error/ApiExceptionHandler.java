package com.tunit.common.error;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import java.util.List;
import java.util.UUID;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.NoHandlerFoundException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

@RestControllerAdvice
public class ApiExceptionHandler {
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(ApiExceptionHandler.class);
    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    ResponseEntity<ApiErrorResponse> method(HttpRequestMethodNotSupportedException exception, HttpServletRequest request) {
        var response = ResponseEntity.status(ErrorCode.METHOD_NOT_ALLOWED.status());
        if (exception.getSupportedMethods() != null) response.header("Allow", String.join(", ", exception.getSupportedMethods()));
        return response.body(ApiErrorResponse.of(ErrorCode.METHOD_NOT_ALLOWED, request.getRequestURI()));
    }
    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    ResponseEntity<ApiErrorResponse> media(Exception exception, HttpServletRequest request) { return reply(ErrorCode.UNSUPPORTED_MEDIA_TYPE, request); }
    @ExceptionHandler(BusinessException.class)
    ResponseEntity<ApiErrorResponse> business(BusinessException exception, HttpServletRequest request) {
        return reply(exception.code(), request);
    }
    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<ApiErrorResponse> validation(MethodArgumentNotValidException exception, HttpServletRequest request) {
        List<FieldErrorDetail> errors = exception.getBindingResult().getFieldErrors().stream()
            .map(error -> new FieldErrorDetail(error.getField(), error.getDefaultMessage())).toList();
        return ResponseEntity.badRequest().body(ApiErrorResponse.of(ErrorCode.INVALID_INPUT, request.getRequestURI(), errors));
    }
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    ResponseEntity<ApiErrorResponse> mismatch(MethodArgumentTypeMismatchException exception, HttpServletRequest request) {
        return reply(exception.getRequiredType() == UUID.class ? ErrorCode.INVALID_UUID : ErrorCode.INVALID_INPUT, request);
    }
    @ExceptionHandler({HttpMessageNotReadableException.class, ConstraintViolationException.class})
    ResponseEntity<ApiErrorResponse> malformed(Exception exception, HttpServletRequest request) { return reply(ErrorCode.INVALID_INPUT, request); }
    @ExceptionHandler(AuthenticationException.class)
    ResponseEntity<ApiErrorResponse> authentication(AuthenticationException exception, HttpServletRequest request) { return reply(ErrorCode.INVALID_CREDENTIALS, request); }
    @ExceptionHandler(org.springframework.security.authentication.InternalAuthenticationServiceException.class)
    ResponseEntity<ApiErrorResponse> authenticationService(Exception exception, HttpServletRequest request) { return reply(ErrorCode.SERVICE_UNAVAILABLE, request); }
    @ExceptionHandler(AccessDeniedException.class)
    ResponseEntity<ApiErrorResponse> denied(AccessDeniedException exception, HttpServletRequest request) { return reply(ErrorCode.ACCESS_DENIED, request); }
    @ExceptionHandler({NoResourceFoundException.class, NoHandlerFoundException.class})
    ResponseEntity<ApiErrorResponse> missing(Exception exception, HttpServletRequest request) { return reply(ErrorCode.RESOURCE_NOT_FOUND, request); }
    @ExceptionHandler(ObjectOptimisticLockingFailureException.class)
    ResponseEntity<ApiErrorResponse> conflict(Exception exception, HttpServletRequest request) { return reply(ErrorCode.CONCURRENT_MODIFICATION, request); }
    @ExceptionHandler(DataAccessResourceFailureException.class)
    ResponseEntity<ApiErrorResponse> unavailable(Exception exception, HttpServletRequest request) { return reply(ErrorCode.SERVICE_UNAVAILABLE, request); }
    @ExceptionHandler(DataIntegrityViolationException.class)
    ResponseEntity<ApiErrorResponse> integrity(Exception exception, HttpServletRequest request) {
        // A future use-case must translate known UNIQUE/FK violations at its transaction boundary.
        // Do not guess that every constraint failure is a duplicate request (409).
        safeLog(exception, request);
        return reply(ErrorCode.INTERNAL_ERROR, request);
    }
    @ExceptionHandler(Exception.class)
    ResponseEntity<ApiErrorResponse> unexpected(Exception exception, HttpServletRequest request) {
        // Do not log arbitrary exception messages: they can contain SQL parameters or credentials.
        safeLog(exception, request);
        return reply(ErrorCode.INTERNAL_ERROR, request);
    }
    private void safeLog(Exception exception, HttpServletRequest request) {
        log.error("API failure method={} path={} exceptionType={}", request.getMethod(), ApiErrorResponse.safePath(request.getRequestURI()), exception.getClass().getSimpleName());
    }
    private ResponseEntity<ApiErrorResponse> reply(ErrorCode code, HttpServletRequest request) {
        return ResponseEntity.status(code.status()).body(ApiErrorResponse.of(code, request.getRequestURI()));
    }
}

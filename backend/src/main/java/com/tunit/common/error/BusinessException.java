package com.tunit.common.error;

public class BusinessException extends RuntimeException {
    private final ErrorCode code;
    public BusinessException(ErrorCode code) { super(code.name()); this.code = code; }
    public ErrorCode code() { return code; }
}

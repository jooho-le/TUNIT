package com.tunit.auth;

import jakarta.validation.constraints.*;

public record LoginRequest(
    @NotBlank(message = "이메일을 입력해 주세요.") @Email(message = "이메일 형식을 확인해 주세요.")
    @Size(max = 255, message = "이메일은 255자 이하여야 합니다.") String email,
    @NotBlank(message = "비밀번호를 입력해 주세요.") String password
) {
    public LoginRequest { if (email != null) email = email.strip().toLowerCase(java.util.Locale.ROOT); }
    @Override public String toString() { return "LoginRequest[credentials=REDACTED]"; }
}

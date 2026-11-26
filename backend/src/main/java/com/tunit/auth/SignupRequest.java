package com.tunit.auth;

import jakarta.validation.constraints.*;

public record SignupRequest(
    @NotBlank(message = "이메일을 입력해 주세요.") @Email(message = "이메일 형식을 확인해 주세요.")
    @Size(max = 255, message = "이메일은 255자 이하여야 합니다.") String email,
    @NotBlank(message = "비밀번호를 입력해 주세요.") @SignupPassword String password,
    @NotBlank(message = "닉네임을 입력해 주세요.")
    @org.hibernate.validator.constraints.CodePointLength(max = 50, message = "닉네임은 50자 이하여야 합니다.") String nickname
) {
    public SignupRequest {
        if (email != null) email = email.strip().toLowerCase(java.util.Locale.ROOT);
        if (nickname != null) nickname = nickname.strip();
    }
    @Override public String toString() { return "SignupRequest[credentials=REDACTED]"; }
}

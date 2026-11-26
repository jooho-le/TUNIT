package com.tunit.user;

import jakarta.validation.constraints.NotBlank;
import org.hibernate.validator.constraints.CodePointLength;

public record NicknamePatch(@NotBlank @CodePointLength(max=50) String nickname) {
    public NicknamePatch { if (nickname!=null) nickname=nickname.strip(); }
}

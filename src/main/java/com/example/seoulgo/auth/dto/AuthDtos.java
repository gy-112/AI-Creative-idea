package com.example.seoulgo.auth.dto;

import jakarta.validation.constraints.*;

public class AuthDtos {

    public record SignupReq(
            @NotBlank @Size(min = 4, max = 20)
            @Pattern(regexp = "^[a-zA-Z0-9_]+$", message = "영문, 숫자, _ 만 사용할 수 있습니다.")
            String loginId,
            @NotBlank @Size(min = 8, max = 50) String password,
            @NotBlank @Size(max = 30) String nickname,
            @Pattern(regexp = "ko|en", message = "ko 또는 en") String language
    ) {}

    public record LoginReq(@NotBlank String loginId, @NotBlank String password) {}

    public record RefreshReq(@NotBlank String refreshToken) {}

    public record SignupRes(Long userId, String nickname) {}

    public record CheckIdRes(boolean available) {}

    public record TokenRes(String accessToken, String refreshToken, boolean hasCharacter) {}
}


package com.example.seoulgo.auth;

import com.example.seoulgo.auth.dto.AuthDtos.*;
import com.example.seoulgo.common.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/signup")
    public ApiResponse<SignupRes> signup(@Valid @RequestBody SignupReq req) {
        return ApiResponse.ok(authService.signup(req));
    }

    @GetMapping("/check-id")
    public ApiResponse<CheckIdRes> checkId(@RequestParam String loginId) {
        return ApiResponse.ok(authService.checkId(loginId));
    }

    @PostMapping("/login")
    public ApiResponse<TokenRes> login(@Valid @RequestBody LoginReq req) {
        return ApiResponse.ok(authService.login(req));
    }

    @PostMapping("/refresh")
    public ApiResponse<TokenRes> refresh(@Valid @RequestBody RefreshReq req) {
        return ApiResponse.ok(authService.refresh(req.refreshToken()));
    }

    @PostMapping("/logout")
    public ApiResponse<Void> logout(@AuthenticationPrincipal Long userId) {
        authService.logout(userId);
        return ApiResponse.ok();
    }
}


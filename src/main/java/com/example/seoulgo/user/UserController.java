package com.example.seoulgo.user;

import com.example.seoulgo.common.ApiResponse;
import com.example.seoulgo.user.UserDtos.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/users/me")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping
    public ApiResponse<ProfileRes> profile(@AuthenticationPrincipal Long userId) {
        return ApiResponse.ok(userService.getProfile(userId));
    }

    @PatchMapping
    public ApiResponse<ProfileRes> update(@AuthenticationPrincipal Long userId,
                                          @Valid @RequestBody UpdateProfileReq req) {
        return ApiResponse.ok(userService.updateProfile(userId, req));
    }

    @GetMapping("/coupons")
    public ApiResponse<List<MyCouponRes>> coupons(@AuthenticationPrincipal Long userId) {
        return ApiResponse.ok(userService.getMyCoupons(userId));
    }

    @PutMapping("/representative-badge")
    public ApiResponse<ProfileRes> representativeBadge(@AuthenticationPrincipal Long userId,
                                                       @RequestBody RepresentativeBadgeReq req) {
        return ApiResponse.ok(userService.changeRepresentativeBadge(userId, req.badgeId()));
    }
}

package com.example.seoulgo.home;

import com.example.seoulgo.common.ApiResponse;
import com.example.seoulgo.home.HomeDtos.HomeRes;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/home")
@RequiredArgsConstructor
public class HomeController {

    private final HomeService homeService;

    @GetMapping
    public ApiResponse<HomeRes> home(@AuthenticationPrincipal Long userId) {
        return ApiResponse.ok(homeService.getHome(userId));
    }
}

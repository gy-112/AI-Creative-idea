package com.example.seoulgo.landmark;

import com.example.seoulgo.common.ApiResponse;
import com.example.seoulgo.landmark.LandmarkDtos.NearbyRes;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/landmarks")
@RequiredArgsConstructor
@Validated
public class LandmarkController {

    private final LandmarkService landmarkService;

    @GetMapping("/nearby")
    public ApiResponse<NearbyRes> nearby(
            @AuthenticationPrincipal Long userId,

            @RequestParam(defaultValue = "37.5665")
            @DecimalMin("-90.0") @DecimalMax("90.0")
            double lat,

            @RequestParam(defaultValue = "126.9780")
            @DecimalMin("-180.0") @DecimalMax("180.0")
            double lng,

            @RequestParam(defaultValue = "50000")
            @Min(1)
            int radius) {

        return ApiResponse.ok(
                landmarkService.nearby(userId, lat, lng, radius)
        );
    }
}
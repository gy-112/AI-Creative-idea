package com.example.seoulgo.collection;

import com.example.seoulgo.collection.CollectionDtos.*;
import com.example.seoulgo.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/collections")
@RequiredArgsConstructor
public class CollectionController {

    private final CollectionService collectionService;

    @GetMapping
    public ApiResponse<CollectionRes> list(@AuthenticationPrincipal Long userId) {
        return ApiResponse.ok(collectionService.getCollections(userId));
    }

    @PostMapping("/{regionId}/coupon")
    public ApiResponse<CouponRes> issueCoupon(@AuthenticationPrincipal Long userId,
                                              @PathVariable Long regionId) {
        return ApiResponse.ok(collectionService.issueCoupon(userId, regionId));
    }
}

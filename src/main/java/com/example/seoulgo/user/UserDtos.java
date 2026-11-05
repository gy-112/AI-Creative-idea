package com.example.seoulgo.user;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public class UserDtos {

    public record BadgeInfo(Long badgeId, String name, String imageUrl) {}

    public record ProfileRes(Long userId, String loginId, String nickname, String language,
                             BadgeInfo representativeBadge) {}

    // 보낸 항목만 수정합니다. 안 보낸 항목(null)은 그대로 둡니다.
    public record UpdateProfileReq(
            @Size(min = 1, max = 30)
            @Pattern(regexp = ".*\\S.*", message = "공백만 입력할 수 없습니다.")
            String nickname,
            @Pattern(regexp = "ko|en", message = "ko 또는 en")
            String language
    ) {}

    // badgeId가 null이면 대표 뱃지 해제
    public record RepresentativeBadgeReq(Long badgeId) {}

    public record MyCouponRes(Long couponId, String title, int discountRate,
                              LocalDate validUntil, String regionName,
                              String status) {}   // AVAILABLE | USED | EXPIRED
}

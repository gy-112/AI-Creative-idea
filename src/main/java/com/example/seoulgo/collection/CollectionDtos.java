package com.example.seoulgo.collection;

import java.time.LocalDate;
import java.util.List;

public class CollectionDtos {

    public record BadgeItem(Long badgeId, String name, String imageUrl, boolean owned) {}

    public record RegionItem(Long regionId, String name, int collected, int total,
                             boolean completed,
                             String couponStatus,   // LOCKED | AVAILABLE | ISSUED
                             List<BadgeItem> badges) {}

    public record CollectionRes(int totalCollected, int totalBadges, List<RegionItem> regions) {}

    public record CouponRes(Long couponId, String title, int discountRate,
                            LocalDate validUntil, String regionName) {}
}

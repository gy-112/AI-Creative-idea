package com.example.seoulgo.collection;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CouponRepository extends JpaRepository<Coupon, Long> {
    List<Coupon> findByMemberId(Long memberId);
    boolean existsByMemberIdAndRegionId(Long memberId, Long regionId);
}

package com.example.seoulgo.collection;

import com.example.seoulgo.badge.MemberBadge;
import com.example.seoulgo.badge.MemberBadgeRepository;
import com.example.seoulgo.collection.CollectionDtos.*;
import com.example.seoulgo.common.BusinessException;
import com.example.seoulgo.common.ErrorCode;
import com.example.seoulgo.landmark.Landmark;
import com.example.seoulgo.landmark.LandmarkRepository;
import com.example.seoulgo.landmark.Region;
import com.example.seoulgo.landmark.RegionRepository;
import com.example.seoulgo.user.Member;
import com.example.seoulgo.user.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CollectionService {

    private static final int DISCOUNT_RATE = 20;
    private static final int VALID_DAYS = 30;   // 임시값: 발급일로부터 30일

    private final MemberRepository memberRepository;
    private final RegionRepository regionRepository;
    private final LandmarkRepository landmarkRepository;
    private final MemberBadgeRepository memberBadgeRepository;
    private final CouponRepository couponRepository;

    @Transactional(readOnly = true)
    public CollectionRes getCollections(Long userId) {
        Member member = memberRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));
        boolean en = "en".equals(member.getLanguage());

        Set<Long> ownedIds = memberBadgeRepository.findByMemberId(userId).stream()
                .map(MemberBadge::getLandmarkId).collect(Collectors.toSet());
        Set<Long> issuedRegionIds = couponRepository.findByMemberId(userId).stream()
                .map(Coupon::getRegionId).collect(Collectors.toSet());

        // 구별로 랜드마크 묶기 (순서 유지)
        Map<Region, List<Landmark>> grouped = landmarkRepository.findAllWithRegion().stream()
                .collect(Collectors.groupingBy(Landmark::getRegion, LinkedHashMap::new, Collectors.toList()));

        List<RegionItem> regions = new ArrayList<>();
        int totalCollected = 0;
        int totalBadges = 0;

        for (var entry : grouped.entrySet()) {
            Region region = entry.getKey();
            List<Landmark> landmarks = entry.getValue();

            List<BadgeItem> badges = landmarks.stream()
                    .map(l -> new BadgeItem(l.getId(), en ? l.getNameEn() : l.getNameKo(),
                            l.getBadgeImageUrl(), ownedIds.contains(l.getId())))
                    .toList();

            int collected = (int) badges.stream().filter(BadgeItem::owned).count();
            int total = badges.size();
            boolean completed = total > 0 && collected == total;

            String couponStatus = issuedRegionIds.contains(region.getId()) ? "ISSUED"
                    : completed ? "AVAILABLE" : "LOCKED";

            regions.add(new RegionItem(region.getId(),
                    en ? region.getNameEn() : region.getNameKo(),
                    collected, total, completed, couponStatus, badges));

            totalCollected += collected;
            totalBadges += total;
        }
        return new CollectionRes(totalCollected, totalBadges, regions);
    }

    @Transactional
    public CouponRes issueCoupon(Long userId, Long regionId) {
        Member member = memberRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));
        Region region = regionRepository.findById(regionId)
                .orElseThrow(() -> new BusinessException(ErrorCode.REGION_NOT_FOUND));

        // 1) 컬렉션 완성 여부
        List<Long> idsInRegion = landmarkRepository.findByRegionId(regionId).stream()
                .map(Landmark::getId).toList();
        long owned = memberBadgeRepository.countByMemberIdAndLandmarkIdIn(userId, idsInRegion);
        if (idsInRegion.isEmpty() || owned < idsInRegion.size()) {
            throw new BusinessException(ErrorCode.COLLECTION_INCOMPLETE);
        }

        // 2) 중복 발급 방지
        if (couponRepository.existsByMemberIdAndRegionId(userId, regionId)) {
            throw new BusinessException(ErrorCode.ALREADY_ISSUED);
        }

        boolean en = "en".equals(member.getLanguage());
        String regionName = en ? region.getNameEn() : region.getNameKo();
        String title = en ? regionName + " Collection Complete" : regionName + " 컬렉션 완성";

        try {
            Coupon c = couponRepository.saveAndFlush(new Coupon(
                    userId, regionId, title, DISCOUNT_RATE, LocalDate.now().plusDays(VALID_DAYS)));
            return new CouponRes(c.getId(), c.getTitle(), c.getDiscountRate(), c.getValidUntil(), regionName);
        } catch (DataIntegrityViolationException e) {
            throw new BusinessException(ErrorCode.ALREADY_ISSUED);   // 동시 요청으로 중복 시도된 경우
        }
    }
}

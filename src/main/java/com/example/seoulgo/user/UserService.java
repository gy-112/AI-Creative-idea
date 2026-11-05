package com.example.seoulgo.user;

import com.example.seoulgo.badge.MemberBadgeRepository;
import com.example.seoulgo.collection.Coupon;
import com.example.seoulgo.collection.CouponRepository;
import com.example.seoulgo.common.BusinessException;
import com.example.seoulgo.common.ErrorCode;
import com.example.seoulgo.landmark.Landmark;
import com.example.seoulgo.landmark.LandmarkRepository;
import com.example.seoulgo.landmark.Region;
import com.example.seoulgo.landmark.RegionRepository;
import com.example.seoulgo.user.UserDtos.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final MemberRepository memberRepository;
    private final MemberBadgeRepository memberBadgeRepository;
    private final LandmarkRepository landmarkRepository;
    private final RegionRepository regionRepository;
    private final CouponRepository couponRepository;

    @Transactional(readOnly = true)
    public ProfileRes getProfile(Long userId) {
        return toProfile(findMember(userId));
    }

    @Transactional
    public ProfileRes updateProfile(Long userId, UpdateProfileReq req) {

        // 수정할 내용이 하나도 없으면 오류
        if (req.nickname() == null && req.language() == null) {
            throw new BusinessException(ErrorCode.INVALID_REQUEST);
        }

        Member member = findMember(userId);

        String nickname = req.nickname() == null
                ? null
                : req.nickname().trim();

        member.updateProfile(nickname, req.language());

        return toProfile(member);
    }

    @Transactional
    public ProfileRes changeRepresentativeBadge(Long userId, Long badgeId) {
        Member member = findMember(userId);
        if (badgeId == null) {
            member.changeRepresentativeBadge(null);       // 해제
        } else {
            if (!memberBadgeRepository.existsByMemberIdAndLandmarkId(userId, badgeId)) {
                throw new BusinessException(ErrorCode.BADGE_NOT_OWNED);
            }
            member.changeRepresentativeBadge(badgeId);
        }
        return toProfile(member);
    }

    @Transactional(readOnly = true)
    public List<MyCouponRes> getMyCoupons(Long userId) {
        Member member = findMember(userId);
        boolean en = "en".equals(member.getLanguage());

        List<Coupon> coupons = couponRepository.findByMemberId(userId);
        Map<Long, Region> regions = regionRepository
                .findAllById(coupons.stream().map(Coupon::getRegionId).toList())
                .stream().collect(Collectors.toMap(Region::getId, Function.identity()));

        LocalDate today = LocalDate.now();
        return coupons.stream()
                .sorted(Comparator.comparing(Coupon::getIssuedAt).reversed())   // 최근 발급 순
                .map(c -> {
                    Region r = regions.get(c.getRegionId());
                    String regionName = r == null ? "" : (en ? r.getNameEn() : r.getNameKo());
                    String status = c.isUsed() ? "USED"
                            : c.getValidUntil().isBefore(today) ? "EXPIRED" : "AVAILABLE";
                    return new MyCouponRes(c.getId(), c.getTitle(), c.getDiscountRate(),
                            c.getValidUntil(), regionName, status);
                })
                .toList();
    }

    private Member findMember(Long userId) {
        return memberRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));
    }

    private ProfileRes toProfile(Member m) {
        BadgeInfo badge = null;
        if (m.getRepresentativeBadgeId() != null) {
            boolean en = "en".equals(m.getLanguage());
            badge = landmarkRepository.findById(m.getRepresentativeBadgeId())
                    .map((Landmark l) -> new BadgeInfo(l.getId(),
                            en ? l.getNameEn() : l.getNameKo(), l.getBadgeImageUrl()))
                    .orElse(null);
        }
        return new ProfileRes(m.getId(), m.getLoginId(), m.getNickname(), m.getLanguage(), badge);
    }
}

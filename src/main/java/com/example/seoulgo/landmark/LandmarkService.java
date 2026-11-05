package com.example.seoulgo.landmark;

import com.example.seoulgo.badge.MemberBadge;
import com.example.seoulgo.badge.MemberBadgeRepository;
import com.example.seoulgo.common.BusinessException;
import com.example.seoulgo.common.ErrorCode;
import com.example.seoulgo.landmark.LandmarkDtos.*;
import com.example.seoulgo.user.Member;
import com.example.seoulgo.user.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LandmarkService {

    private final LandmarkRepository landmarkRepository;
    private final MemberRepository memberRepository;
    private final MemberBadgeRepository memberBadgeRepository;

    @Transactional(readOnly = true)
    public NearbyRes nearby(Long userId, double lat, double lng, int radiusM) {
        Member member = memberRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));
        boolean en = "en".equals(member.getLanguage());

        Set<Long> ownedIds = memberBadgeRepository.findByMemberId(userId).stream()
                .map(MemberBadge::getLandmarkId)
                .collect(Collectors.toSet());

        List<NearbyItem> items = landmarkRepository.findAllWithRegion().stream()
                .map(l -> {
                    int dist = (int) Math.round(distanceM(lat, lng, l.getLatitude(), l.getLongitude()));
                    return new NearbyItem(
                            l.getId(),
                            en ? l.getNameEn() : l.getNameKo(),
                            en ? l.getRegion().getNameEn() : l.getRegion().getNameKo(),
                            l.getLatitude(),
                            l.getLongitude(),
                            dist,
                            l.getBadgeImageUrl(),
                            ownedIds.contains(l.getId()));
                })
                .filter(i -> i.distanceM() <= radiusM)
                .sorted(Comparator.comparingInt(NearbyItem::distanceM))
                .toList();

        return new NearbyRes(lat, lng, items);
    }

    private double distanceM(
            double lat1, double lng1,
            double lat2, double lng2) {

        double r = 6371000;

        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);

        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1))
                * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLng / 2) * Math.sin(dLng / 2);

        // 부동소수점 오차 방지
        a = Math.max(0.0, Math.min(1.0, a));

        return r * 2 * Math.atan2(
                Math.sqrt(a),
                Math.sqrt(1 - a)
        );
    }
}

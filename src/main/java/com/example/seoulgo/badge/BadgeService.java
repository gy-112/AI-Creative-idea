package com.example.seoulgo.badge;

import com.example.seoulgo.common.BusinessException;
import com.example.seoulgo.common.ErrorCode;
import com.example.seoulgo.landmark.Landmark;
import com.example.seoulgo.landmark.LandmarkRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BadgeService {

    private final MemberBadgeRepository memberBadgeRepository;
    private final LandmarkRepository landmarkRepository;

    /** newlyAcquired: 이번에 새로 얻었는지 / completedRegionId: 이 뱃지로 구 컬렉션이 완성되면 그 구 ID, 아니면 null */
    public record GrantResult(boolean newlyAcquired, Long completedRegionId) {}

    @Transactional
    public GrantResult grant(Long memberId, Long landmarkId) {
        Landmark landmark = landmarkRepository.findById(landmarkId)
                .orElseThrow(() -> new BusinessException(ErrorCode.LANDMARK_NOT_FOUND));

        if (memberBadgeRepository.existsByMemberIdAndLandmarkId(
                memberId, landmarkId)) {
            return new GrantResult(false, null);
        }

        memberBadgeRepository.save(new MemberBadge(memberId, landmarkId));
        Long regionId = landmark.getRegion().getId();
        List<Long> idsInRegion = landmarkRepository.findByRegionId(regionId)
                .stream().map(Landmark::getId).toList();
        long owned = memberBadgeRepository.countByMemberIdAndLandmarkIdIn(memberId, idsInRegion);

        Long completed = (owned == idsInRegion.size()) ? regionId : null;
        return new GrantResult(true, completed);
    }
}

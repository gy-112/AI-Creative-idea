package com.example.seoulgo.badge;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Collection;
import java.util.List;

public interface MemberBadgeRepository extends JpaRepository<MemberBadge, Long> {
    List<MemberBadge> findByMemberId(Long memberId);
    boolean existsByMemberIdAndLandmarkId(Long memberId, Long landmarkId);
    long countByMemberId(Long memberId);
    long countByMemberIdAndLandmarkIdIn(Long memberId, Collection<Long> landmarkIds);
}

package com.example.seoulgo.home;

import com.example.seoulgo.badge.MemberBadgeRepository;
import com.example.seoulgo.character.CharacterRepository;
import com.example.seoulgo.common.BusinessException;
import com.example.seoulgo.common.ErrorCode;
import com.example.seoulgo.home.HomeDtos.*;
import com.example.seoulgo.landmark.LandmarkRepository;
import com.example.seoulgo.user.Member;
import com.example.seoulgo.user.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class HomeService {

    private final MemberRepository memberRepository;
    private final CharacterRepository characterRepository;
    private final MemberBadgeRepository memberBadgeRepository;
    private final LandmarkRepository landmarkRepository;

    @Transactional(readOnly = true)
    public HomeRes getHome(Long userId) {
        Member member = memberRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));

        // 캐릭터가 없으면 null → 프런트가 캐릭터 선택란을 보여줌
        CharacterInfo character = characterRepository.findByMemberId(userId)
                .map(c -> new CharacterInfo(
                        c.getId(), c.getName(), c.getType(), c.getImageUrl(),
                        new Equipped(c.getFaceItemId(), c.getBodyItemId(),
                                c.getHandItemId(), c.getBackgroundItemId())))
                .orElse(null);

        String greeting = "en".equals(member.getLanguage())
                ? "Where shall we go today?"
                : "오늘은 어디로 떠나볼까?";

        Progress progress = new Progress(
                (int) memberBadgeRepository.countByMemberId(userId),
                (int) landmarkRepository.count());

        return new HomeRes(member.getNickname(), character, greeting, progress);
    }
}

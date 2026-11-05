package com.example.seoulgo.character;

import com.example.seoulgo.common.BusinessException;
import com.example.seoulgo.common.ErrorCode;
import com.example.seoulgo.user.Member;
import com.example.seoulgo.user.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CharacterService {

    private final CharacterRepository characterRepository;
    private final MemberRepository memberRepository;

    public record CharacterOption(String type, String name, String imageUrl, boolean selected) {}

    @Transactional
    public UserCharacter create(Long memberId, String name, String type) {
        if (characterRepository.existsByMemberId(memberId)) {
            throw new BusinessException(ErrorCode.CHARACTER_ALREADY_EXISTS);
        }
        return characterRepository.save(new UserCharacter(memberId, name, type));
    }

    /** 선택 가능한 캐릭터 목록. 지금 고른 것은 selected = true */
    @Transactional(readOnly = true)
    public List<CharacterOption> options(Long memberId) {
        boolean en = isEnglish(memberId);
        String current = characterRepository.findByMemberId(memberId)
                .map(UserCharacter::getType).orElse(null);

        return Arrays.stream(CharacterType.values())
                .map(t -> new CharacterOption(t.name(), t.displayName(en), t.imageUrl(),
                        t.name().equals(current)))
                .toList();
    }

    /** 캐릭터가 없으면 새로 만들고, 있으면 타입만 변경 (이름, 장착 아이템은 유지) */
    @Transactional
    public UserCharacter select(Long memberId, CharacterType type, String name) {
        UserCharacter existing = characterRepository.findByMemberId(memberId).orElse(null);
        if (existing != null) {
            existing.changeType(type.name());   // 변경 감지로 자동 저장
            return existing;
        }
        String finalName = (name == null || name.isBlank())
                ? type.displayName(isEnglish(memberId))
                : name.trim();
        return characterRepository.save(new UserCharacter(memberId, finalName, type.name()));
    }

    private boolean isEnglish(Long memberId) {
        Member m = memberRepository.findById(memberId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));
        return "en".equals(m.getLanguage());
    }
}


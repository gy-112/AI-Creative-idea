package com.example.seoulgo.auth;

import com.example.seoulgo.auth.dto.AuthDtos.*;
import com.example.seoulgo.character.CharacterRepository;
import com.example.seoulgo.common.BusinessException;
import com.example.seoulgo.common.ErrorCode;
import com.example.seoulgo.user.Member;
import com.example.seoulgo.user.MemberRepository;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;

@Service
@RequiredArgsConstructor
public class AuthService {

    private static final String REFRESH_KEY = "refresh:";

    private final MemberRepository memberRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtProvider jwtProvider;
    private final StringRedisTemplate redis;
    private final CharacterRepository characterRepository;


    @Transactional
    public SignupRes signup(SignupReq req) {
        if (memberRepository.existsByLoginId(req.loginId())) {
            throw new BusinessException(ErrorCode.LOGIN_ID_DUPLICATED);
        }
        String lang = req.language() == null ? "ko" : req.language();
        Member m = memberRepository.save(new Member(
                req.loginId(), passwordEncoder.encode(req.password()), req.nickname(), lang));
        return new SignupRes(m.getId(), m.getNickname());
    }

    @Transactional(readOnly = true)
    public CheckIdRes checkId(String loginId) {
        return new CheckIdRes(!memberRepository.existsByLoginId(loginId));
    }

    @Transactional(readOnly = true)
    public TokenRes login(LoginReq req) {
        Member m = memberRepository.findByLoginId(req.loginId())
                .orElseThrow(() -> new BusinessException(ErrorCode.LOGIN_FAILED));
        if (!passwordEncoder.matches(req.password(), m.getPassword())) {
            throw new BusinessException(ErrorCode.LOGIN_FAILED);   // 아이디/비번 어느 쪽이 틀렸는지 알려주지 않음
        }
        return issueTokens(m.getId());
    }

    public TokenRes refresh(String refreshToken) {
        Claims claims;
        try {
            claims = jwtProvider.parse(refreshToken);
        } catch (JwtException | IllegalArgumentException e) {
            throw new BusinessException(ErrorCode.INVALID_TOKEN);
        }
        if (!jwtProvider.isType(claims, "refresh")) {
            throw new BusinessException(ErrorCode.INVALID_TOKEN);
        }
        Long userId = jwtProvider.getUserId(claims);
        String saved = redis.opsForValue().get(REFRESH_KEY + userId);
        if (saved == null || !saved.equals(refreshToken)) {
            throw new BusinessException(ErrorCode.INVALID_TOKEN);   // 로그아웃됐거나 이미 교체된 토큰
        }
        return issueTokens(userId);   // 재발급할 때 refresh도 새로 교체
    }

    public void logout(Long userId) {
        redis.delete(REFRESH_KEY + userId);
    }

    private TokenRes issueTokens(Long userId) {
        String access = jwtProvider.createAccessToken(userId);
        String refresh = jwtProvider.createRefreshToken(userId);
        redis.opsForValue().set(REFRESH_KEY + userId, refresh,
                Duration.ofMillis(jwtProvider.getRefreshExpireMs()));
        boolean hasCharacter = characterRepository.existsByMemberId(userId);
        return new TokenRes(access, refresh, hasCharacter);
    }
}


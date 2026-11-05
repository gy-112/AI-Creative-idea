package com.example.seoulgo.user;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Member {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 30)
    private String loginId;

    @Column(nullable = false)
    private String password;      // BCrypt 해시

    @Column(nullable = false, length = 30)
    private String nickname;

    @Column(nullable = false, length = 5)
    private String language;      // ko | en

    // 대표 뱃지 = 랜드마크 ID (뱃지 ID와 랜드마크 ID가 같음). null이면 미설정
    @Column(name = "representative_badge_id")
    private Long representativeBadgeId;

    private LocalDateTime createdAt;

    public Member(String loginId, String password, String nickname, String language) {
        this.loginId = loginId;
        this.password = password;
        this.nickname = nickname;
        this.language = language;
        this.createdAt = LocalDateTime.now();
    }

    public void updateProfile(String nickname, String language) {
        if (nickname != null) this.nickname = nickname;
        if (language != null) this.language = language;
    }

    public void changeRepresentativeBadge(Long landmarkId) {
        this.representativeBadgeId = landmarkId;
    }
}



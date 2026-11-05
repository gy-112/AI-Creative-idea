package com.example.seoulgo.badge;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "member_badges",
        uniqueConstraints = @UniqueConstraint(columnNames = {"member_id", "landmark_id"}))
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class MemberBadge {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "member_id", nullable = false)
    private Long memberId;

    @Column(name = "landmark_id", nullable = false)
    private Long landmarkId;

    private LocalDateTime acquiredAt;

    public MemberBadge(Long memberId, Long landmarkId) {
        this.memberId = memberId;
        this.landmarkId = landmarkId;
        this.acquiredAt = LocalDateTime.now();
    }
}

package com.example.seoulgo.collection;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "coupons",
        uniqueConstraints = @UniqueConstraint(columnNames = {"member_id", "region_id"}))
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Coupon {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "member_id", nullable = false)
    private Long memberId;

    @Column(name = "region_id", nullable = false)
    private Long regionId;

    @Column(nullable = false)
    private String title;

    private int discountRate;
    private LocalDate validUntil;
    private boolean used;              // 사용 완료 여부 (사용 처리 API는 나중에)
    private LocalDateTime issuedAt;

    public Coupon(Long memberId, Long regionId, String title, int discountRate, LocalDate validUntil) {
        this.memberId = memberId;
        this.regionId = regionId;
        this.title = title;
        this.discountRate = discountRate;
        this.validUntil = validUntil;
        this.used = false;
        this.issuedAt = LocalDateTime.now();
    }
}

package com.example.seoulgo.landmark;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "landmark")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Landmark {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 50)
    private String code;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "region_id")
    private Region region;

    @Column(name = "name_ko", nullable = false, length = 100)
    private String nameKo;

    @Column(name = "name_en", nullable = false, length = 100)
    private String nameEn;

    private double latitude;
    private double longitude;

    @Column(name = "badge_image_url")
    private String badgeImageUrl;     // 이 랜드마크의 뱃지 이미지
}


package com.example.seoulgo.landmark;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "region")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Region {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 30)
    private String code;          // JONGNO, JUNG, MAPO

    @Column(name = "name_ko", nullable = false, length = 30)
    private String nameKo;

    @Column(name = "name_en", nullable = false, length = 50)
    private String nameEn;
}


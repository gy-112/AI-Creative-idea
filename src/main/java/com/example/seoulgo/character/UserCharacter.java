package com.example.seoulgo.character;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "characters")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class UserCharacter {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private Long memberId;

    @Column(nullable = false, length = 30)
    private String name;

    @Column(nullable = false, length = 30)
    private String type;          // KPOP_STAR, DRAMA_LOVER ...

    // 장착 중인 아이템 ID (null이면 미착용). 아이템 기능을 만들면 연결합니다.
    private Long faceItemId;
    private Long bodyItemId;
    private Long handItemId;
    private Long backgroundItemId;

    public UserCharacter(Long memberId, String name, String type) {
        this.memberId = memberId;
        this.name = name;
        this.type = type;
    }

    /** 타입별 기본 이미지. static 폴더에 파일을 넣으면 됩니다. */
    public String getImageUrl() {
        return "/images/characters/" + type.toLowerCase() + ".png";
    }

    public void changeType(String type) {
        this.type = type;
    }

}

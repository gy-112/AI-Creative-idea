package com.example.seoulgo.character;

public enum CharacterType {
    KPOP_STAR("케이팝 스타", "K-POP Star"),
    DRAMA_LOVER("드라마 러버", "Drama Lover"),
    HISTORY_BUFF("역사 탐험가", "History Explorer"),
    FOODIE("미식가", "Foodie");

    public final String nameKo;
    public final String nameEn;

    CharacterType(String nameKo, String nameEn) {
        this.nameKo = nameKo;
        this.nameEn = nameEn;
    }

    public String displayName(boolean en) {
        return en ? nameEn : nameKo;
    }

    public String imageUrl() {
        return "/images/characters/" + name().toLowerCase() + ".png";
    }
}

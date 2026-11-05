package com.example.seoulgo.home;

public class HomeDtos {

    public record Equipped(Long face, Long body, Long hand, Long background) {}

    public record CharacterInfo(Long characterId, String name, String type,
                                String imageUrl, Equipped equipped) {}

    public record Progress(int collectedBadges, int totalBadges) {}

    public record HomeRes(String nickname, CharacterInfo character,
                          String greeting, Progress progress) {}
}

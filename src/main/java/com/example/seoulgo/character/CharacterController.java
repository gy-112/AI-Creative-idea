package com.example.seoulgo.character;

import com.example.seoulgo.character.CharacterService.CharacterOption;
import com.example.seoulgo.common.ApiResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class CharacterController {

    private static final String TYPES = "KPOP_STAR|DRAMA_LOVER|HISTORY_BUFF|FOODIE";

    private final CharacterService characterService;

    public record CreateReq(
            @NotBlank @Size(max = 30) String name,
            @NotBlank
            @Pattern(regexp = TYPES, message = "지원하지 않는 캐릭터 타입입니다.")
            String type
    ) {}

    // name은 선택. 비우면 캐릭터 기본 이름이 들어감
    public record SelectReq(
            @NotBlank @Pattern(regexp = TYPES, message = "지원하지 않는 캐릭터 타입입니다.") String type,
            @Size(max = 30) String name
    ) {}

    public record CharacterRes(Long characterId, String name, String type, String imageUrl) {}

    @GetMapping("/characters")
    public ApiResponse<List<CharacterOption>> options(@AuthenticationPrincipal Long userId) {
        return ApiResponse.ok(characterService.options(userId));
    }

    @PostMapping("/character/create")
    public ApiResponse<CharacterRes> create(@AuthenticationPrincipal Long userId,
                                            @Valid @RequestBody CreateReq req) {
        return ApiResponse.ok(toRes(characterService.create(userId, req.name(), req.type())));
    }

    @PutMapping("/character/me")
    public ApiResponse<CharacterRes> select(@AuthenticationPrincipal Long userId,
                                            @Valid @RequestBody SelectReq req) {
        UserCharacter c = characterService.select(userId, CharacterType.valueOf(req.type()), req.name());
        return ApiResponse.ok(toRes(c));
    }

    private CharacterRes toRes(UserCharacter c) {
        return new CharacterRes(c.getId(), c.getName(), c.getType(), c.getImageUrl());
    }
}

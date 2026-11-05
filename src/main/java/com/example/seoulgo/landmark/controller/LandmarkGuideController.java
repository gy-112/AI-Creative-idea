package com.example.seoulgo.landmark.controller;

import com.example.seoulgo.ai.llm.OpenAiGuideClient;
import com.example.seoulgo.ai.llm.OpenAiGuideClient.GuideUpstreamException;
import com.example.seoulgo.common.ApiResponse;
import org.springframework.context.annotation.Profile;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import tools.jackson.databind.json.JsonMapper;

import java.io.IOException;
import java.util.Locale;
import java.util.Map;

@Profile("vision-dev")
@CrossOrigin(origins = "${SEOULGO_FRONTEND_ORIGIN:http://127.0.0.1:8000}")
@RestController
@RequestMapping("/api/v1/landmarks/{landmarkId:[a-z][a-z0-9-]*}")
public final class LandmarkGuideController {
    private final OpenAiGuideClient guideClient;
    private final Map<String, GuideContent> guides;

    public LandmarkGuideController(OpenAiGuideClient guideClient, JsonMapper mapper) throws IOException {
        this.guideClient = guideClient;
        try (var resource = new ClassPathResource("landmarks/guides.json").getInputStream()) {
            this.guides = Map.copyOf(mapper.readerForMapOf(GuideContent.class).readValue(resource));
        }
    }

    @GetMapping
    public ResponseEntity<ApiResponse<?>> detail(@PathVariable("landmarkId") String landmarkId, Locale locale) {
        var content = guides.get(landmarkId);
        if (content == null) return error(404, "LANDMARK_NOT_FOUND");

        var place = "en".equals(locale.getLanguage()) ? content.en() : content.ko();
        var detail = new Detail(landmarkId, place.name(), place.description(), place.characterComment(), content.sourceRef());
        return ResponseEntity.ok(ApiResponse.ok(detail));
    }

    @PostMapping("/questions")
    public ResponseEntity<ApiResponse<?>> ask(
            @PathVariable("landmarkId") String landmarkId, @RequestBody Question request
    ) {
        var content = guides.get(landmarkId);
        if (content == null) return error(404, "LANDMARK_NOT_FOUND");

        if (request.question() == null || request.question().isBlank() || request.question().strip().length() > 500) {
            return error(400, "INVALID_QUESTION");
        }
        boolean english = "en".equals(request.language());
        if (!english && !"ko".equals(request.language())) return error(400, "UNSUPPORTED_LANGUAGE");
        if (!guideClient.isConfigured()) return error(503, "GUIDE_NOT_CONFIGURED");

        var place = english ? content.en() : content.ko();
        try {
            String answer = guideClient.answer(place.name(), place.visitorFacts(),
                    english ? "English" : "Korean", request.question().strip());
            return ResponseEntity.ok(ApiResponse.ok(new Answer(answer, content.sourceRef())));
        } catch (GuideUpstreamException ex) {
            return error(502, "AI_SERVICE_ERROR");
        }
    }

    private static ResponseEntity<ApiResponse<?>> error(int status, String code) {
        return ResponseEntity.status(status).body(ApiResponse.fail(code, switch (code) {
            case "LANDMARK_NOT_FOUND" -> "랜드마크를 찾을 수 없습니다.";
            case "INVALID_QUESTION" -> "질문을 1자 이상 500자 이하로 입력해 주세요.";
            case "UNSUPPORTED_LANGUAGE" -> "한국어와 영어를 지원합니다.";
            case "GUIDE_NOT_CONFIGURED" -> "AI 가이드 설정이 필요합니다.";
            default -> "AI 가이드에 연결하지 못했습니다.";
        }));
    }

    public record Question(String question, String language) {}
    public record Detail(String landmarkId, String name, String description, String characterComment, String sourceRef) {}
    public record Answer(String answer, String sourceRef) {}
    public record GuideContent(Place ko, Place en, String sourceRef) {}
    public record Place(String name, String description, String characterComment, String visitorFacts) {}
}

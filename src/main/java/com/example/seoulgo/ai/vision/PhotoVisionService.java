package com.example.seoulgo.ai.vision;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;
import tools.jackson.databind.node.ObjectNode;

import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Base64;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
public final class PhotoVisionService {
    private static final int MAX_PHOTO_BYTES = 10 * 1024 * 1024;
    private static final URI RESPONSES_URL = URI.create("https://api.openai.com/v1/responses");

    private final JsonMapper mapper;
    private final ObjectNode requestTemplate;
    private final JsonNode feedbackByCode;
    private final String apiKey;
    private final HttpClient client;
    private final URI endpoint;

    @Autowired
    public PhotoVisionService(
            JsonMapper mapper,
            @Value("${OPENAI_API_KEY:}") String apiKey,
            @Value("${OPENAI_VISION_MODEL:}") String modelOverride
    ) throws IOException {
        this(mapper, apiKey, modelOverride,
                HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build(), RESPONSES_URL);
    }

    PhotoVisionService(JsonMapper mapper, String apiKey, String modelOverride,
                       HttpClient client, URI endpoint) throws IOException {
        this.mapper = mapper;
        this.apiKey = apiKey.strip();
        this.client = client;
        this.endpoint = endpoint;
        try (InputStream resource = new ClassPathResource("vision/photo-verification.json").getInputStream()) {
            JsonNode config = mapper.readTree(resource);
            requestTemplate = (ObjectNode) config.required("request");
            feedbackByCode = config.required("feedback");
        }
        if (!modelOverride.isBlank()) {
            requestTemplate.put("model", modelOverride.strip());
        }
    }

    public Result verify(MultipartFile photo, String landmark, String requirement, String language) {
        if (photo.isEmpty()) {
            throw new InvalidPhotoException("INVALID_REQUEST");
        }
        if (photo.getSize() > MAX_PHOTO_BYTES) {
            throw new InvalidPhotoException("FILE_TOO_LARGE");
        }
        if (landmark.isBlank() || requirement.isBlank()) {
            throw new IllegalArgumentException("Landmark and requirement must come from the mission definition.");
        }

        try {
            byte[] bytes = photo.getBytes();
            String mimeType = imageType(bytes);
            if (apiKey.isEmpty()) {
                throw new VisionUpstreamException("OPENAI_API_KEY is missing on the server.");
            }

            String dataUrl = "data:" + mimeType + ";base64," + Base64.getEncoder().encodeToString(bytes);
            ObjectNode payload = requestTemplate.deepCopy();
            payload.set("input", mapper.valueToTree(List.of(Map.of(
                    "role", "user",
                    "content", List.of(
                            Map.of("type", "input_text", "text",
                                    "Expected landmark: " + landmark + "\nRequired features: " + requirement),
                            Map.of("type", "input_image", "image_url", dataUrl, "detail", "high")
                    )
            ))));

            HttpRequest request = HttpRequest.newBuilder(endpoint)
                    .timeout(Duration.ofSeconds(35))
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(mapper.writeValueAsString(payload)))
                    .build();
            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) {
                String requestId = response.headers().firstValue("x-request-id").orElse("unavailable");
                throw new VisionUpstreamException(
                        "OpenAI HTTP " + response.statusCode() + ", request ID " + requestId);
            }
            ScoredPose scoredPose = parseVerdict(mapper.readTree(response.body()));
            ReasonCode code = scoredPose.code() == ReasonCode.PASS && scoredPose.score() >= 80
                    ? ReasonCode.PASS
                    : ReasonCode.INSUFFICIENT_VIEW;
            boolean english = "en".equals(language == null ? "" : language.strip().toLowerCase(Locale.ROOT));
            String feedback = code == ReasonCode.PASS
                    ? (english ? "Pose verified." : "포즈 미션을 통과했어요.")
                    : (english ? "Show both arms clearly and match the example pose."
                               : "두 팔이 잘 보이게 예시 포즈를 따라 다시 찍어주세요.");
            return new Result(code == ReasonCode.PASS, code, feedback, scoredPose.score());
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new VisionUpstreamException("Vision request interrupted.", ex);
        } catch (JacksonException ex) {
            throw new VisionUpstreamException("Could not encode the Vision request or decode its response.", ex);
        } catch (IOException ex) {
            throw new VisionUpstreamException("Could not read the photo or complete the Vision request.", ex);
        }
    }

    private ScoredPose parseVerdict(JsonNode response) {
        if (!"completed".equals(response.path("status").asString(""))) {
            throw new VisionUpstreamException("OpenAI did not complete the response.");
        }
        for (JsonNode output : response.path("output")) {
            if (!"message".equals(output.path("type").asString(""))) {
                continue;
            }
            for (JsonNode content : output.path("content")) {
                String type = content.path("type").asString("");
                if ("refusal".equals(type)) {
                    throw new VisionUpstreamException("OpenAI refused the image request.");
                }
                if ("output_text".equals(type)) {
                    JsonNode verdict = mapper.readTree(content.path("text").asString(""));
                    if (verdict == null || !verdict.isObject()) {
                        throw new VisionUpstreamException("OpenAI returned a malformed verdict.");
                    }
                    int score = verdict.path("poseScore").asInt(-1);
                    if (!verdict.path("poseScore").isIntegralNumber() || score < 0 || score > 100) {
                        throw new VisionUpstreamException("OpenAI returned an invalid pose score.");
                    }
                    try {
                        return new ScoredPose(ReasonCode.valueOf(verdict.path("reasonCode").asString("")), score);
                    } catch (IllegalArgumentException ex) {
                        throw new VisionUpstreamException("OpenAI returned an unknown reason code.", ex);
                    }
                }
            }
        }
        throw new VisionUpstreamException("OpenAI returned no verdict.");
    }

    private static String imageType(byte[] bytes) {
        if (bytes.length >= 3 && bytes[0] == (byte) 0xFF
                && bytes[1] == (byte) 0xD8 && bytes[2] == (byte) 0xFF) {
            return "image/jpeg";
        }
        if (bytes.length >= 8 && bytes[0] == (byte) 0x89 && bytes[1] == 'P'
                && bytes[2] == 'N' && bytes[3] == 'G' && bytes[4] == 13
                && bytes[5] == 10 && bytes[6] == 26 && bytes[7] == 10) {
            return "image/png";
        }
        if (bytes.length >= 12 && bytes[0] == 'R' && bytes[1] == 'I' && bytes[2] == 'F'
                && bytes[3] == 'F' && bytes[8] == 'W' && bytes[9] == 'E'
                && bytes[10] == 'B' && bytes[11] == 'P') {
            return "image/webp";
        }
        throw new InvalidPhotoException("UNSUPPORTED_MEDIA_TYPE");
    }

    private record ScoredPose(ReasonCode code, int score) {}
    public record Result(boolean passed, ReasonCode reasonCode, String feedback, int poseScore) {}

    public enum ReasonCode {
        PASS, INSUFFICIENT_VIEW, WRONG_LANDMARK
    }

    public static final class InvalidPhotoException extends IllegalArgumentException {
        public InvalidPhotoException(String code) {
            super(code);
        }
    }

    public static final class VisionUpstreamException extends RuntimeException {
        public VisionUpstreamException(String message) {
            super(message);
        }

        public VisionUpstreamException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}

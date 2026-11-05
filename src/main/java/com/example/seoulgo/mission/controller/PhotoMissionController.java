package com.example.seoulgo.mission.controller;

import com.example.seoulgo.ai.stt.OpenAiTranscriptionClient.TranscriptionException;
import com.example.seoulgo.ai.vision.PhotoVisionService;
import com.example.seoulgo.location.MissionLocationService;
import com.example.seoulgo.mission.service.PhotoMissionService;
import com.example.seoulgo.mission.service.VoiceMissionService;
import org.springframework.context.annotation.Profile;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Locale;

@Profile("vision-dev")
@RestController
public class PhotoMissionController {

    private final PhotoMissionService photoMissions;
    private final VoiceMissionService voiceMissions;
    private final MissionLocationService location;

    public PhotoMissionController(
            PhotoMissionService photoMissions,
            VoiceMissionService voiceMissions,
            MissionLocationService location
    ) {
        this.photoMissions = photoMissions;
        this.voiceMissions = voiceMissions;
        this.location = location;
    }

    @GetMapping("/api/v1/missions/location-settings")
    public ResponseEntity<ApiResponse> locationSettings() {
        return ok(new LocationSettings(location.isEnabled()));
    }

    @PostMapping(path = "/api/v1/missions/{missionId}/photo",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse> verifyPhoto(
            @PathVariable("missionId") long missionId,
            @RequestParam("image") MultipartFile photo,
            @RequestParam(value = "latitude", required = false) Double latitude,
            @RequestParam(value = "longitude", required = false) Double longitude,
            @RequestHeader(value = "Accept-Language", defaultValue = "en") String language
    ) {
        if (!photoMissions.supports(missionId)) return error(404, "MISSION_NOT_FOUND");
        var locationResult = location.check(missionId, latitude, longitude);
        if (locationResult != MissionLocationService.Result.ALLOWED) {
            return locationFailure(locationResult, language, true);
        }

        boolean ko = isKorean(language);

        try {
            var result = photoMissions.verify(missionId, photo, ko ? "ko" : "en");
            boolean passed = result.passed();
            MissionResult status = passed ? MissionResult.PASSED : MissionResult.NEEDS_RETRY;
            return ok(new PhotoResult(status, result.poseScore() / 100.0, result.poseScore(),
                    List.of(new Check("pose_match", passed)), location.isEnabled() ? true : null,
                    result.feedback(), !passed, result.reasonCode().name(), null, null));
        } catch (PhotoVisionService.InvalidPhotoException ex) {
            int status = switch (ex.getMessage()) {
                case "FILE_TOO_LARGE" -> 413;
                case "UNSUPPORTED_MEDIA_TYPE" -> 415;
                default -> 400;
            };
            return error(status, ex.getMessage());
        } catch (PhotoVisionService.VisionUpstreamException ex) {
            return error(502, "AI_SERVICE_ERROR");
        }
    }

    @PostMapping(path = "/api/v1/missions/{missionId}/voice",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse> verifyVoice(
            @PathVariable("missionId") long missionId,
            @RequestParam("audio") MultipartFile audio,
            @RequestParam(value = "latitude", required = false) Double latitude,
            @RequestParam(value = "longitude", required = false) Double longitude,
            @RequestHeader(value = "Accept-Language", defaultValue = "en") String language
    ) {
        if (!voiceMissions.supports(missionId)) return error(404, "MISSION_NOT_FOUND");

        var locationResult = location.check(missionId, latitude, longitude);
        if (locationResult != MissionLocationService.Result.ALLOWED) {
            return locationFailure(locationResult, language, false);
        }

        if (audio.isEmpty()) return error(400, "INVALID_REQUEST");
        if (audio.getSize() > 5L * 1024 * 1024) return error(413, "FILE_TOO_LARGE");

        String filename = audio.getOriginalFilename();
        if (filename == null || !filename.matches("(?i).+\\.(wav|mp3|m4a|webm)$")) {
            return error(415, "UNSUPPORTED_MEDIA_TYPE");
        }

        try {
            var result = voiceMissions.verify(missionId, audio);
            boolean verified = result.verified();
            boolean ko = isKorean(language);
            String feedback = verified
                    ? (ko ? "음성 미션을 통과했어요." : "Voice mission passed.")
                    : (ko ? "목표 문장을 천천히 읽고 다시 녹음해 주세요."
                          : "Read the target sentence slowly and record again.");

            return ok(new VoiceResult(verified ? MissionResult.PASSED : MissionResult.FAILED,
                    result.score(), VoiceMissionService.PASS_SCORE, result.transcript(),
                    new VoiceFeedback(feedback, result.missedWords()), null, !verified, null));
        } catch (TranscriptionException ex) {
            return error(502, "AI_SERVICE_ERROR");
        }
    }

    private static ResponseEntity<ApiResponse> locationFailure(
            MissionLocationService.Result result, String language, boolean photo
    ) {
        return switch (result) {
            case INVALID_LOCATION -> error(400, "INVALID_LOCATION");
            case MISSION_LOCATION_NOT_CONFIGURED ->
                    error(503, "MISSION_LOCATION_NOT_CONFIGURED");
            case OUTSIDE_RADIUS -> outsideRadius(language, photo);
            case ALLOWED -> throw new IllegalArgumentException("Location was allowed.");
        };
    }

    private static ResponseEntity<ApiResponse> outsideRadius(String language, boolean photo) {
        String feedback = isKorean(language)
                ? "미션 지점에서 500m 이내로 이동해 주세요."
                : "Move within 500 m of the mission point.";
        if (photo) {
            return ok(new PhotoResult(MissionResult.FAILED, null, null, List.of(), false,
                    feedback, true, "OUTSIDE_RADIUS", null, null));
        }
        return ok(new VoiceResult(MissionResult.FAILED, null, VoiceMissionService.PASS_SCORE, null,
                new VoiceFeedback(feedback, List.of()), null, true, "OUTSIDE_RADIUS"));
    }

    private static boolean isKorean(String language) {
        return language.toLowerCase(Locale.ROOT).startsWith("ko");
    }

    private static ResponseEntity<ApiResponse> ok(Object data) {
        return ResponseEntity.ok(new ApiResponse(true, data, null));
    }

    private static ResponseEntity<ApiResponse> error(int status, String code) {
        return ResponseEntity.status(status)
                .body(new ApiResponse(false, null, new ApiError(code)));
    }

    public enum MissionResult { PASSED, FAILED, NEEDS_RETRY }

    public record LocationSettings(boolean gpsRequired) {}

    public record Check(String name, boolean passed) {}

    public record PhotoResult(
            MissionResult result, Double confidence, Integer poseScore, List<Check> checks,
            Boolean locationVerified, String feedback, boolean retryAvailable, String reasonCode,
            Object nextMission, Object reward
    ) {}

    public record VoiceFeedback(String summary, List<String> missedWords) {}

    public record VoiceResult(
            MissionResult result, Integer accuracyScore, int passScore, String recognizedText,
            VoiceFeedback feedback, Object reward, boolean retryAvailable, String reasonCode
    ) {}

    public record ApiError(String code) {}

    public record ApiResponse(boolean success, Object data, ApiError error) {}
}

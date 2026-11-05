package com.example.seoulgo.mission.service;

import com.example.seoulgo.ai.stt.OpenAiTranscriptionClient;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.text.Normalizer;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
public class VoiceMissionService {
    public static final int PASS_SCORE = 80;
    private static final Map<Long, String> VOICE_TARGETS = Map.of(
            101L, "대한독립 만세!",
            102L, "신에게는 아직 열두 척의 배가 남아 있사옵니다"
    );

    private final OpenAiTranscriptionClient transcriptionClient;

    public VoiceMissionService(OpenAiTranscriptionClient transcriptionClient) {
        this.transcriptionClient = transcriptionClient;
    }

    public boolean supports(long missionId) {
        return VOICE_TARGETS.containsKey(missionId);
    }

    public Result verify(long missionId, MultipartFile audio) {
        String target = VOICE_TARGETS.get(missionId);
        String transcript = transcriptionClient.transcribe(audio);
        int score = sentenceScore(target, transcript);
        String normalizedTranscript = normalize(transcript);
        List<String> missedWords = Arrays.stream(target.split("\\s+"))
                .filter(word -> !normalizedTranscript.contains(normalize(word)))
                .toList();
        return new Result(score >= PASS_SCORE, score, transcript, missedWords);
    }

    private static int sentenceScore(String target, String transcript) {
        String expected = normalize(target);
        String actual = normalize(transcript);
        if (actual.isEmpty()) return 0;

        int[] row = new int[expected.length() + 1];
        for (int j = 0; j < row.length; j++) row[j] = j;

        for (int i = 1; i <= actual.length(); i++) {
            int diagonal = row[0];
            row[0] = i;
            for (int j = 1; j < row.length; j++) {
                int above = row[j];
                int cost = actual.charAt(i - 1) == expected.charAt(j - 1) ? 0 : 1;
                row[j] = Math.min(Math.min(above + 1, row[j - 1] + 1), diagonal + cost);
                diagonal = above;
            }
        }

        int maxLength = Math.max(expected.length(), actual.length());
        return 100 * (maxLength - row[expected.length()]) / maxLength;
    }

    private static String normalize(String text) {
        return Normalizer.normalize(text, Normalizer.Form.NFKC)
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^\\p{L}\\p{N}]", "")
                .replace("12척", "열두척");
    }

    public record Result(boolean verified, int score, String transcript, List<String> missedWords) {}
}

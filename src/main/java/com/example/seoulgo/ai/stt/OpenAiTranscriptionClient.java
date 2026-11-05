package com.example.seoulgo.ai.stt;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.multipart.MultipartFile;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.json.JsonMapper;

import java.net.http.HttpClient;
import java.time.Duration;

@Service
public class OpenAiTranscriptionClient {
    private final JsonMapper mapper;
    private final RestClient openAi;
    private final String apiKey;
    private final String model;

    public OpenAiTranscriptionClient(
            JsonMapper mapper,
            @Value("${OPENAI_API_KEY:}") String apiKey,
            @Value("${OPENAI_STT_MODEL:gpt-transcribe}") String model
    ) {
        this.mapper = mapper;
        this.apiKey = apiKey;
        this.model = model;

        var http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();
        var requestFactory = new JdkClientHttpRequestFactory(http);
        requestFactory.setReadTimeout(Duration.ofSeconds(35));
        this.openAi = RestClient.builder()
                .baseUrl("https://api.openai.com")
                .requestFactory(requestFactory)
                .build();
    }

    public String transcribe(MultipartFile audio) {
        if (apiKey.isBlank()) {
            throw new TranscriptionException("OpenAI API key is missing.");
        }

        var form = new LinkedMultiValueMap<String, Object>();
        form.add("model", model);
        form.add("file", audio.getResource());

        try {
            String body = openAi.post()
                    .uri("/v1/audio/transcriptions")
                    .headers(headers -> headers.setBearerAuth(apiKey))
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(form)
                    .retrieve()
                    .body(String.class);

            if (body == null) {
                throw new TranscriptionException("OpenAI returned no transcription response.");
            }

            var text = mapper.readTree(body).path("text");
            if (!text.isString()) {
                throw new TranscriptionException("OpenAI response is missing transcript text.");
            }
            return text.asString("");
        } catch (RestClientException | JacksonException ex) {
            throw new TranscriptionException("OpenAI transcription failed.", ex);
        }
    }

    public static class TranscriptionException extends RuntimeException {
        public TranscriptionException(String message) {
            super(message);
        }

        public TranscriptionException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}

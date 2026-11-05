package com.example.seoulgo.common;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/app-info")
public class AppInfoController {

    public record AppInfoRes(String appName, String version, List<String> supportedLanguages) {}

    @Value("${app.version:0.0.1}")
    private String version;

    @GetMapping
    public ApiResponse<AppInfoRes> info() {
        return ApiResponse.ok(new AppInfoRes("SEOUL GO!", version, List.of("ko", "en")));
    }
}
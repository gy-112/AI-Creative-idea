package com.example.seoulgo.common;

public record ApiResponse<T>(boolean success, String code, String message, T data) {
    public static <T> ApiResponse<T> ok(T data) {
        return new ApiResponse<>(true, "OK", "요청이 성공했습니다.", data);
    }
    public static ApiResponse<Void> ok() {
        return new ApiResponse<>(true, "OK", "요청이 성공했습니다.", null);
    }
    public static ApiResponse<Void> fail(String code, String message) {
        return new ApiResponse<>(false, code, message, null);
    }
}

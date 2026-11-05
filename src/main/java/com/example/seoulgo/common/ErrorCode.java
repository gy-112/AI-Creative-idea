package com.example.seoulgo.common;

import org.springframework.http.HttpStatus;

public enum ErrorCode {
    INVALID_REQUEST(HttpStatus.BAD_REQUEST, "요청값이 올바르지 않습니다."),
    UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다."),
    LOGIN_FAILED(HttpStatus.UNAUTHORIZED, "아이디 또는 비밀번호가 올바르지 않습니다."),
    INVALID_TOKEN(HttpStatus.UNAUTHORIZED, "유효하지 않은 토큰입니다."),
    LOGIN_ID_DUPLICATED(HttpStatus.CONFLICT, "이미 사용 중인 아이디입니다."),
    MEMBER_NOT_FOUND(HttpStatus.NOT_FOUND, "회원을 찾을 수 없습니다."),
    CHARACTER_ALREADY_EXISTS(HttpStatus.CONFLICT, "이미 캐릭터가 있습니다."),
    INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "서버 오류가 발생했습니다."),
    REGION_NOT_FOUND(HttpStatus.NOT_FOUND, "지역을 찾을 수 없습니다."),
    LANDMARK_NOT_FOUND(HttpStatus.NOT_FOUND, "랜드마크를 찾을 수 없습니다."),
    COLLECTION_INCOMPLETE(HttpStatus.FORBIDDEN, "컬렉션을 아직 완성하지 못했습니다."),
    ALREADY_ISSUED(HttpStatus.CONFLICT, "이미 쿠폰을 발급받았습니다."),
    BADGE_NOT_OWNED(HttpStatus.FORBIDDEN, "보유하지 않은 뱃지입니다.");

    public final HttpStatus status;
    public final String message;

    ErrorCode(HttpStatus status, String message) {
        this.status = status;
        this.message = message;
    }
}

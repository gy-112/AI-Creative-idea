package com.example.seoulgo.auth;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
public class JwtProvider {

    private final SecretKey key;
    private final long accessExpireMs;
    private final long refreshExpireMs;

    public JwtProvider(@Value("${jwt.secret}") String secret,
                       @Value("${jwt.access-expire-ms}") long accessExpireMs,
                       @Value("${jwt.refresh-expire-ms}") long refreshExpireMs) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.accessExpireMs = accessExpireMs;
        this.refreshExpireMs = refreshExpireMs;
    }

    public String createAccessToken(Long userId) {
        return create(userId, "access", accessExpireMs);
    }

    public String createRefreshToken(Long userId) {
        return create(userId, "refresh", refreshExpireMs);
    }

    public long getRefreshExpireMs() { return refreshExpireMs; }

    private String create(Long userId, String type, long expireMs) {
        Date now = new Date();
        return Jwts.builder()
                .subject(String.valueOf(userId))
                .claim("type", type)
                .issuedAt(now)
                .expiration(new Date(now.getTime() + expireMs))
                .signWith(key)
                .compact();
    }

    /** 유효하면 Claims 반환, 아니면 JwtException */
    public Claims parse(String token) throws JwtException {
        return Jwts.parser().verifyWith(key).build()
                .parseSignedClaims(token).getPayload();
    }

    public Long getUserId(Claims claims) {
        return Long.parseLong(claims.getSubject());
    }

    public boolean isType(Claims claims, String type) {
        return type.equals(claims.get("type", String.class));
    }
}


package com.opentoilet.dto.response;

import java.time.LocalDateTime;

public record AuthSessionResponse(String accessToken, String tokenType, LocalDateTime expiresAt, UserResponse user) {
    public record UserResponse(Long id, String username) { }
}

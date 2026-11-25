package com.opentoilet.service;

import com.opentoilet.dto.request.LoginRequest;
import com.opentoilet.dto.request.RegisterRequest;
import com.opentoilet.dto.response.AuthSessionResponse;
import com.opentoilet.entity.AppUser;
import com.opentoilet.entity.AuthSession;
import com.opentoilet.repository.AppUserRepository;
import com.opentoilet.repository.AuthSessionRepository;
import com.opentoilet.security.AppUserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;

@Service
@RequiredArgsConstructor
public class AuthService {
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final long SESSION_HOURS = 12;

    private final AppUserRepository userRepository;
    private final AuthSessionRepository sessionRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public AuthSessionResponse register(RegisterRequest request) {
        String username = request.getUsername().trim();
        if (userRepository.existsByUsername(username)) throw new IllegalStateException("이미 사용 중인 아이디입니다.");
        AppUser user = userRepository.save(new AppUser(username, passwordEncoder.encode(request.getPassword())));
        return issueSession(user);
    }

    @Transactional
    public AuthSessionResponse login(LoginRequest request) {
        AppUser user = userRepository.findByUsername(request.getUsername().trim())
                .orElseThrow(InvalidCredentialsException::new);
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) throw new InvalidCredentialsException();
        return issueSession(user);
    }

    @Transactional(readOnly = true)
    public AppUserPrincipal authenticate(String accessToken) {
        if (accessToken == null || accessToken.isBlank() || accessToken.length() > 200) return null;
        return sessionRepository.findByTokenHashAndExpiresAtAfter(hash(accessToken), LocalDateTime.now())
                .map(session -> new AppUserPrincipal(session.getUser().getId(), session.getUser().getUsername(), session.getTokenHash()))
                .orElse(null);
    }

    @Transactional
    public void logout(AppUserPrincipal principal) {
        if (principal != null) sessionRepository.deleteById(principal.tokenHash());
    }

    private AuthSessionResponse issueSession(AppUser user) {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        LocalDateTime expiresAt = LocalDateTime.now().plusHours(SESSION_HOURS);
        sessionRepository.save(new AuthSession(hash(token), user, expiresAt));
        return new AuthSessionResponse(token, "Bearer", expiresAt,
                new AuthSessionResponse.UserResponse(user.getId(), user.getUsername()));
    }

    private String hash(String value) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (Exception ex) {
            throw new IllegalStateException("인증 토큰을 처리하지 못했습니다.", ex);
        }
    }
}

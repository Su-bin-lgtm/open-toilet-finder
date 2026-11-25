package com.opentoilet.controller;

import com.opentoilet.dto.request.LoginRequest;
import com.opentoilet.dto.request.RegisterRequest;
import com.opentoilet.dto.response.ApiResponse;
import com.opentoilet.dto.response.AuthSessionResponse;
import com.opentoilet.security.AppUserPrincipal;
import com.opentoilet.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthSessionResponse>> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("회원가입이 완료되었습니다.", authService.register(request)));
    }

    @PostMapping("/login")
    public ApiResponse<AuthSessionResponse> login(@Valid @RequestBody LoginRequest request) {
        return ApiResponse.ok(authService.login(request));
    }

    @GetMapping("/me")
    public ApiResponse<AuthSessionResponse.UserResponse> me(Authentication authentication) {
        AppUserPrincipal user = (AppUserPrincipal) authentication.getPrincipal();
        return ApiResponse.ok(new AuthSessionResponse.UserResponse(user.id(), user.username()));
    }

    @PostMapping("/logout")
    public ApiResponse<Boolean> logout(Authentication authentication) {
        authService.logout((AppUserPrincipal) authentication.getPrincipal());
        return ApiResponse.ok("로그아웃되었습니다.", true);
    }
}

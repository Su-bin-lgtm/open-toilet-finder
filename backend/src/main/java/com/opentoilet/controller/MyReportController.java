package com.opentoilet.controller;

import com.opentoilet.dto.response.ApiResponse;
import com.opentoilet.dto.response.MyReportResponse;
import com.opentoilet.service.MyReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import org.springframework.security.core.Authentication;
import com.opentoilet.security.AppUserPrincipal;

@RestController
@RequestMapping("/api/v1/reports")
@RequiredArgsConstructor
public class MyReportController {

    private final MyReportService myReportService;

    // 익명 기기별 제보 조회. 로그인 인증을 대체하지 않습니다.
    @GetMapping("/me")
    public ApiResponse<List<MyReportResponse>> getMyReports(
            @RequestHeader(value = "X-Device-Id", required = false) String deviceId,
            Authentication authentication
    ) {
        if (authentication != null && authentication.getPrincipal() instanceof AppUserPrincipal principal) {
            return ApiResponse.ok(myReportService.findByUserId(principal.id()));
        }
        return ApiResponse.ok(myReportService.findByDeviceId(deviceId));
    }
}

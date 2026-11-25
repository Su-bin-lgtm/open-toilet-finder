package com.opentoilet.controller;

import com.opentoilet.dto.request.ToiletReportCreateRequest;
import com.opentoilet.dto.response.ApiResponse;
import com.opentoilet.dto.response.ToiletReportResponse;
import com.opentoilet.service.ReportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import org.springframework.security.core.Authentication;
import com.opentoilet.security.AppUserPrincipal;

@RestController
@RequestMapping("/api/v1/toilets/{toiletId}/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    // 화장실 상태 제보 등록
    @PostMapping
    public ResponseEntity<ApiResponse<Long>> createReport(
            @PathVariable("toiletId") Long toiletId,
            @Valid @RequestBody ToiletReportCreateRequest request,
            @RequestHeader(value = "X-Device-Id", required = false) String deviceId,
            Authentication authentication
    ) {
        Long reportId = reportService.createReport(toiletId, request, deviceId, userId(authentication));
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("상태 제보가 등록되었습니다.", reportId));
    }

    private Long userId(Authentication authentication) {
        return authentication != null && authentication.getPrincipal() instanceof AppUserPrincipal principal ? principal.id() : null;
    }

    // 특정 화장실의 전체 제보 목록 조회
    @GetMapping
    public ResponseEntity<ApiResponse<List<ToiletReportResponse>>> getReports(
            @PathVariable("toiletId") Long toiletId
    ) {
        List<ToiletReportResponse> reports = reportService.getReports(toiletId);
        return ResponseEntity.ok(ApiResponse.ok(reports));
    }
}

package com.opentoilet.controller;

import com.opentoilet.dto.request.IssueReportCreateRequest;
import com.opentoilet.dto.request.IssueReviewRequest;
import com.opentoilet.dto.response.ApiResponse;
import com.opentoilet.dto.response.IssueReportResponse;
import com.opentoilet.entity.enums.IssueStatus;
import com.opentoilet.service.IssueService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import org.springframework.security.core.Authentication;
import com.opentoilet.security.AppUserPrincipal;

@RestController
@RequestMapping("/api/v1/toilets")
@RequiredArgsConstructor
public class IssueController {

    private final IssueService issueService;

    // 화장실 정보 오류 신고 접수
    @PostMapping("/{toiletId}/issues")
    public ResponseEntity<ApiResponse<Long>> createIssue(
            @PathVariable("toiletId") Long toiletId,
            @Valid @RequestBody IssueReportCreateRequest request,
            @RequestHeader(value = "X-Device-Id", required = false) String deviceId,
            Authentication authentication
    ) {
        Long issueId = issueService.createIssue(toiletId, request, deviceId, userId(authentication));
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("신고가 접수되었습니다. 확인 후 조치하겠습니다.", issueId));
    }

    private Long userId(Authentication authentication) {
        return authentication != null && authentication.getPrincipal() instanceof AppUserPrincipal principal ? principal.id() : null;
    }

    // 신고 처리 상태 변경 (관리자용)
    @PatchMapping("/issues/{issueId}/status")
    public ResponseEntity<ApiResponse<Void>> updateIssueStatus(
            @PathVariable("issueId") Long issueId,
            @RequestParam("status") IssueStatus status,
            @Valid @RequestBody(required = false) IssueReviewRequest reviewRequest
    ) {
        issueService.updateIssueStatus(issueId, status, reviewRequest);
        return ResponseEntity.ok(ApiResponse.ok("신고 상태가 '" + status.getDescription() + "'(으)로 변경되었습니다.", null));
    }

    // 신고 목록 조회 (관리자용)
    @GetMapping("/issues")
    public ResponseEntity<ApiResponse<List<IssueReportResponse>>> getIssues(
            @RequestParam(value = "status", required = false) IssueStatus status
    ) {
        List<IssueReportResponse> issues = issueService.getIssues(status).stream()
                .map(IssueReportResponse::from)
                .toList();
        return ResponseEntity.ok(ApiResponse.ok(issues));
    }
}

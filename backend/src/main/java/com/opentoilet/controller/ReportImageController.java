package com.opentoilet.controller;

import com.opentoilet.dto.response.ApiResponse;
import com.opentoilet.dto.response.ReportImageResponse;
import com.opentoilet.entity.enums.ReportImageKind;
import com.opentoilet.service.ReportImageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/v1/report-images")
@RequiredArgsConstructor
public class ReportImageController {
    private final ReportImageService reportImageService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<ReportImageResponse>> upload(
            @RequestParam ReportImageKind kind,
            @RequestParam Long reportId,
            @RequestParam Long toiletId,
            @RequestParam("file") MultipartFile file,
            @RequestHeader(value = "X-Device-Id", required = false) String deviceId,
            Authentication authentication) {
        ReportImageResponse response = kind == ReportImageKind.TOILET_STATUS
                ? reportImageService.uploadToiletReport(toiletId, reportId, file, deviceId, authentication)
                : reportImageService.uploadIssue(toiletId, reportId, file, deviceId, authentication);
        return ResponseEntity.ok(ApiResponse.ok("제보 이미지가 저장되었습니다.", response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ReportImageResponse>>> list(
            @RequestParam ReportImageKind kind,
            @RequestParam Long reportId,
            @RequestHeader(value = "X-Device-Id", required = false) String deviceId,
            Authentication authentication) {
        List<ReportImageResponse> response = kind == ReportImageKind.TOILET_STATUS
                ? reportImageService.listForToiletReport(reportId, deviceId, authentication)
                : reportImageService.listForIssue(reportId, deviceId, authentication);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/{imageId}")
    public ResponseEntity<byte[]> read(@PathVariable Long imageId,
                                       @RequestHeader(value = "X-Device-Id", required = false) String deviceId,
                                       Authentication authentication) {
        ReportImageService.StoredImage image = reportImageService.read(imageId, deviceId, authentication);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(image.mediaType()))
                .cacheControl(CacheControl.noStore())
                .header("X-Content-Type-Options", "nosniff")
                .body(image.content());
    }
}

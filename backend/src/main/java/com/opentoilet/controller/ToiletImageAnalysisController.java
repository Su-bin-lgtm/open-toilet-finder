package com.opentoilet.controller;

import com.opentoilet.dto.response.ApiResponse;
import com.opentoilet.dto.response.ImageAnalysisResponse;
import com.opentoilet.repository.ToiletRepository;
import com.opentoilet.service.ToiletImageAnalyzer;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/toilets/{toiletId}/images")
@RequiredArgsConstructor
public class ToiletImageAnalysisController {
    private static final long MAX_SIZE = 10L * 1024 * 1024;
    private final ToiletRepository toiletRepository;
    private final ToiletImageAnalyzer imageAnalyzer;

    @PostMapping(value = "/analyze", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<ImageAnalysisResponse>> analyze(
            @PathVariable Long toiletId,
            @RequestParam("file") MultipartFile file
    ) {
        if (!toiletRepository.existsById(toiletId)) return ResponseEntity.notFound().build();
        if (file.isEmpty()) return ResponseEntity.badRequest().body(ApiResponse.error("이미지 파일이 비어 있습니다."));
        if (file.getSize() > MAX_SIZE) return ResponseEntity.badRequest().body(ApiResponse.error("이미지는 10MB 이하여야 합니다."));
        String contentType = file.getContentType();
        if (contentType == null || !(contentType.equalsIgnoreCase("image/jpeg")
                || contentType.equalsIgnoreCase("image/png") || contentType.equalsIgnoreCase("image/webp"))) {
            return ResponseEntity.badRequest().body(ApiResponse.error("JPEG, PNG, WebP 이미지만 지원합니다."));
        }
        return ResponseEntity.ok(ApiResponse.ok(imageAnalyzer.analyze(toiletId, file)));
    }
}

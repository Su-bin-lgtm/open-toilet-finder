package com.opentoilet.controller;

import com.opentoilet.dto.request.ToiletCreateRequest;
import com.opentoilet.dto.request.ToiletNearbyRequest;
import com.opentoilet.dto.response.ApiResponse;
import com.opentoilet.dto.response.ToiletDetailResponse;
import com.opentoilet.dto.response.ToiletSummaryResponse;
import com.opentoilet.service.ToiletService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/toilets")
@RequiredArgsConstructor
public class ToiletController {

    private final ToiletService toiletService;

    // 반경 내 화장실 탐색 (필터 지원)
    @GetMapping("/nearby")
    public ResponseEntity<ApiResponse<List<ToiletSummaryResponse>>> getNearbyToilets(
            @Valid @ModelAttribute ToiletNearbyRequest request
    ) {
        List<ToiletSummaryResponse> responses = toiletService.findNearbyToilets(request);
        return ResponseEntity.ok(ApiResponse.ok(responses));
    }

    // 화장실 이름 또는 주소 키워드 검색
    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<ToiletSummaryResponse>>> searchToilets(
            @RequestParam("keyword") String keyword,
            @RequestParam(value = "lat", required = false) Double lat,
            @RequestParam(value = "lng", required = false) Double lng
    ) {
        List<ToiletSummaryResponse> responses = toiletService.searchToilets(keyword, lat, lng);
        return ResponseEntity.ok(ApiResponse.ok(responses));
    }

    // 화장실 단건 상세 조회
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ToiletDetailResponse>> getToiletDetail(
            @PathVariable("id") Long id,
            @RequestParam(value = "lat", required = false) Double lat,
            @RequestParam(value = "lng", required = false) Double lng
    ) {
        ToiletDetailResponse response = toiletService.getToiletDetail(id, lat, lng);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    // 신규 화장실 등록
    @PostMapping
    public ResponseEntity<ApiResponse<Long>> createToilet(
            @Valid @RequestBody ToiletCreateRequest request
    ) {
        Long createdId = toiletService.createToilet(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("신규 개방화장실이 등록되었습니다.", createdId));
    }
}

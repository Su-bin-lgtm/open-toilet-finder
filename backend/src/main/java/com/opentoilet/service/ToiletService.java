package com.opentoilet.service;

import com.opentoilet.dto.request.ToiletCreateRequest;
import com.opentoilet.dto.request.ToiletNearbyRequest;
import com.opentoilet.dto.response.ToiletDetailResponse;
import com.opentoilet.dto.response.ToiletReportResponse;
import com.opentoilet.dto.response.ToiletSummaryResponse;
import com.opentoilet.entity.Toilet;
import com.opentoilet.entity.enums.SourceType;
import com.opentoilet.repository.ToiletReportRepository;
import com.opentoilet.repository.ToiletRepository;
import com.opentoilet.util.LocationUtils;
import com.opentoilet.util.TimeUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ToiletService {

    private final ToiletRepository toiletRepository;
    private final ToiletReportRepository toiletReportRepository;

    // 현재 위치 기반 주변 반경 내 화장실 탐색 및 필터링
    public List<ToiletSummaryResponse> findNearbyToilets(ToiletNearbyRequest request) {
        double userLat = request.getLat();
        double userLng = request.getLng();
        int radiusMeter = request.getRadiusMeter() != null ? request.getRadiusMeter() : 500;

        double[] box = LocationUtils.getBoundingBox(userLat, userLng, radiusMeter);
        List<Toilet> candidates = toiletRepository.findWithinBoundingBox(box[0], box[1], box[2], box[3]);

        return candidates.stream()
                .map(toilet -> {
                    int dist = LocationUtils.calculateDistanceMeter(userLat, userLng, toilet.getLatitude(), toilet.getLongitude());
                    boolean openNow = TimeUtils.isOpenNow(toilet.getIsOpen24h(), toilet.getOpenTimeInfo());
                    return new Object() {
                        final Toilet t = toilet;
                        final int distance = dist;
                        final boolean isOpen = openNow;
                    };
                })
                .filter(item -> item.distance <= radiusMeter)
                .filter(item -> !Boolean.TRUE.equals(request.getHasDisabled()) || Boolean.TRUE.equals(item.t.getHasDisabledToilet()))
                .filter(item -> !Boolean.TRUE.equals(request.getHasDiaper()) || Boolean.TRUE.equals(item.t.getHasDiaperTable()))
                .filter(item -> !Boolean.TRUE.equals(request.getHasTissue()) || Boolean.TRUE.equals(item.t.getHasTissue()))
                .filter(item -> !Boolean.TRUE.equals(request.getOnlyOpen()) || item.isOpen)
                .sorted(Comparator.comparingInt(item -> item.distance))
                .map(item -> ToiletSummaryResponse.from(item.t, item.distance, item.isOpen))
                .collect(Collectors.toList());
    }

    // 화장실 이름 또는 주소 키워드 검색
    public List<ToiletSummaryResponse> searchToilets(String keyword, Double userLat, Double userLng) {
        if (keyword == null || keyword.isBlank()) {
            return List.of();
        }

        List<Toilet> found = toiletRepository.searchByKeyword(keyword.trim());

        return found.stream()
                .map(toilet -> {
                    Integer dist = null;
                    if (userLat != null && userLng != null) {
                        dist = LocationUtils.calculateDistanceMeter(userLat, userLng, toilet.getLatitude(), toilet.getLongitude());
                    }
                    boolean openNow = TimeUtils.isOpenNow(toilet.getIsOpen24h(), toilet.getOpenTimeInfo());
                    return ToiletSummaryResponse.from(toilet, dist, openNow);
                })
                .sorted((a, b) -> {
                    if (a.getDistanceMeter() != null && b.getDistanceMeter() != null) {
                        return Integer.compare(a.getDistanceMeter(), b.getDistanceMeter());
                    }
                    return 0;
                })
                .collect(Collectors.toList());
    }

    // 특정 화장실 상세 조회 (최근 제보 5건 포함)
    public ToiletDetailResponse getToiletDetail(Long id, Double userLat, Double userLng) {
        Toilet toilet = toiletRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("해당 화장실을 찾을 수 없습니다. (id: " + id + ")"));

        Integer distanceMeter = null;
        if (userLat != null && userLng != null) {
            distanceMeter = LocationUtils.calculateDistanceMeter(userLat, userLng, toilet.getLatitude(), toilet.getLongitude());
        }

        boolean openNow = TimeUtils.isOpenNow(toilet.getIsOpen24h(), toilet.getOpenTimeInfo());

        List<ToiletReportResponse> recentReports = toiletReportRepository.findTop5ByToiletIdOrderByCreatedAtDesc(id)
                .stream()
                .map(ToiletReportResponse::from)
                .collect(Collectors.toList());

        return ToiletDetailResponse.of(toilet, distanceMeter, openNow, recentReports);
    }

    // 신규 화장실 등록
    @Transactional
    public Long createToilet(ToiletCreateRequest request) {
        Toilet toilet = Toilet.builder()
                .name(request.getName())
                .address(request.getAddress())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .openTimeInfo(request.getOpenTimeInfo())
                .isOpen24h(request.getIsOpen24h())
                .doorLockCode(request.getDoorLockCode())
                .isUnisex(request.getIsUnisex())
                .hasDisabledToilet(request.getHasDisabledToilet())
                .hasDiaperTable(request.getHasDiaperTable())
                .hasTissue(request.getHasTissue())
                .sourceType(SourceType.USER_REGISTERED)
                .build();

        Toilet saved = toiletRepository.save(toilet);
        return saved.getId();
    }
}

package com.opentoilet.service;

import com.opentoilet.dto.request.ToiletNearbyRequest;
import com.opentoilet.dto.response.ToiletSummaryResponse;
import com.opentoilet.entity.Toilet;
import com.opentoilet.entity.enums.HygieneStatus;
import com.opentoilet.entity.enums.SourceType;
import com.opentoilet.repository.ToiletReportRepository;
import com.opentoilet.repository.ToiletRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyDouble;
import static org.mockito.BDDMockito.given;

// ToiletService 핵심 비즈니스 로직 단위 테스트
@ExtendWith(MockitoExtension.class)
class ToiletServiceTest {

    @Mock
    private ToiletRepository toiletRepository;

    @Mock
    private ToiletReportRepository toiletReportRepository;

    @InjectMocks
    private ToiletService toiletService;

    @Test
    @DisplayName("주변 화장실 검색 시 사용자로부터 가장 가까운 거리순으로 정렬되어 반환되어야 한다")
    void findNearbyToiletsSortedByDistance() {
        // Given: 사용자 위치 (선문대학교 정문)
        double userLat = 36.797000;
        double userLng = 127.075000;

        // 가까운 화장실 A (약 190m)
        Toilet toiletNear = Toilet.builder()
                .id(1L)
                .name("가까운 화장실 A")
                .address("아산시 탕정면")
                .latitude(36.798700)
                .longitude(127.075100)
                .isOpen24h(true)
                .hasTissue(true)
                .hygieneStatus(HygieneStatus.CLEAN)
                .sourceType(SourceType.PUBLIC_DATA)
                .build();

        // 먼 화장실 B (약 800m)
        Toilet toiletFar = Toilet.builder()
                .id(2L)
                .name("먼 화장실 B")
                .address("아산시 탕정면")
                .latitude(36.804000)
                .longitude(127.075100)
                .isOpen24h(true)
                .hasTissue(true)
                .hygieneStatus(HygieneStatus.CLEAN)
                .sourceType(SourceType.PUBLIC_DATA)
                .build();

        // Repository 모킹 (사각 영역 쿼리 결과로 두 화장실 반환)
        given(toiletRepository.findWithinBoundingBox(anyDouble(), anyDouble(), anyDouble(), anyDouble()))
                .willReturn(List.of(toiletFar, toiletNear));

        ToiletNearbyRequest request = new ToiletNearbyRequest();
        request.setLat(userLat);
        request.setLng(userLng);
        request.setRadiusMeter(1000); // 1km 반경

        // When: 주변 검색 호출
        List<ToiletSummaryResponse> results = toiletService.findNearbyToilets(request);

        // Then: 거리가 가까운 A가 먼저 나와야 함
        assertEquals(2, results.size());
        assertEquals("가까운 화장실 A", results.get(0).getName());
        assertEquals("먼 화장실 B", results.get(1).getName());
        assertTrue(results.get(0).getDistanceMeter() < results.get(1).getDistanceMeter());
    }

    @Test
    @DisplayName("장애인 화장실 필터 적용 시 장애인 시설이 있는 화장실만 필터링되어야 한다")
    void findNearbyToiletsFilterDisabled() {
        double userLat = 36.797000;
        double userLng = 127.075000;

        Toilet normalToilet = Toilet.builder()
                .id(1L)
                .name("일반 화장실")
                .address("아산시")
                .latitude(36.797500)
                .longitude(127.075000)
                .hasDisabledToilet(false)
                .isOpen24h(true)
                .sourceType(SourceType.PUBLIC_DATA)
                .build();

        Toilet disabledToilet = Toilet.builder()
                .id(2L)
                .name("장애인 전용 구비 화장실")
                .address("아산시")
                .latitude(36.798000)
                .longitude(127.075000)
                .hasDisabledToilet(true)
                .isOpen24h(true)
                .sourceType(SourceType.PUBLIC_DATA)
                .build();

        given(toiletRepository.findWithinBoundingBox(anyDouble(), anyDouble(), anyDouble(), anyDouble()))
                .willReturn(List.of(normalToilet, disabledToilet));

        ToiletNearbyRequest request = new ToiletNearbyRequest();
        request.setLat(userLat);
        request.setLng(userLng);
        request.setRadiusMeter(1000);
        request.setHasDisabled(true); // 장애인 화장실 필터 ON

        // When
        List<ToiletSummaryResponse> results = toiletService.findNearbyToilets(request);

        // Then: 장애인 화장실만 1건 조회되어야 함
        assertEquals(1, results.size());
        assertEquals("장애인 전용 구비 화장실", results.get(0).getName());
    }
}


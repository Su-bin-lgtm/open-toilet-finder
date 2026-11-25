package com.opentoilet.util;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

// 위치 계산 유틸리티 단위 테스트
class LocationUtilsTest {

    @Test
    @DisplayName("하버사인 공식을 이용한 두 좌표 사이의 거리 계산이 정확해야 한다")
    void calculateDistanceMeterTest() {
        // Given: 선문대학교 본관 (36.798782, 127.074984)과 공학관 (36.799650, 127.073520)
        double lat1 = 36.798782;
        double lon1 = 127.074984;
        double lat2 = 36.799650;
        double lon2 = 127.073520;

        // When: 거리 계산 수행
        int distance = LocationUtils.calculateDistanceMeter(lat1, lon1, lat2, lon2);

        // Then: 캠퍼스 내 두 건물 사이의 직선 거리는 약 160m 내외여야 함
        assertTrue(distance > 100 && distance < 250, "거리 계산 결과가 예상 범위(100m~250m) 내에 있어야 합니다: " + distance + "m");
    }

    @Test
    @DisplayName("동일한 좌표 사이의 거리는 0미터여야 한다")
    void sameLocationDistanceShouldBeZero() {
        double lat = 36.798782;
        double lon = 127.074984;

        int distance = LocationUtils.calculateDistanceMeter(lat, lon, lat, lon);

        assertEquals(0, distance);
    }

    @Test
    @DisplayName("Bounding Box 사각 영역이 중심 좌표를 기준으로 대칭 생성되어야 한다")
    void getBoundingBoxTest() {
        // Given: 중심 좌표와 500m 반경
        double centerLat = 36.798782;
        double centerLng = 127.074984;
        int radiusMeter = 500;

        // When: 사각 영역 계산
        double[] box = LocationUtils.getBoundingBox(centerLat, centerLng, radiusMeter);

        double minLat = box[0];
        double maxLat = box[1];
        double minLng = box[2];
        double maxLng = box[3];

        // Then: 최소 좌표는 중심보다 작고, 최대 좌표는 중심보다 커야 함
        assertTrue(minLat < centerLat);
        assertTrue(maxLat > centerLat);
        assertTrue(minLng < centerLng);
        assertTrue(maxLng > centerLng);
    }
}


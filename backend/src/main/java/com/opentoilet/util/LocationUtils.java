package com.opentoilet.util;

// 하버사인(Haversine) 공식을 활용한 GPS 좌표 간 실제 구면 거리 및 Bounding Box 계산 유틸리티
public class LocationUtils {

    private static final double EARTH_RADIUS_METER = 6371000.0;
    private static final double KM_PER_LATITUDE_DEGREE = 111.0;

    private LocationUtils() {}

    // 두 GPS 좌표 사이의 최단 표면 거리(미터) 계산
    public static int calculateDistanceMeter(double lat1, double lon1, double lat2, double lon2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);

        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return (int) Math.round(EARTH_RADIUS_METER * c);
    }

    // 중심 좌표와 반경(미터) 기준 사각 영역(Bounding Box) 계산
    public static double[] getBoundingBox(double centerLat, double centerLng, int radiusMeter) {
        double radiusKm = radiusMeter / 1000.0;
        double deltaLat = radiusKm / KM_PER_LATITUDE_DEGREE;
        double deltaLng = radiusKm / (KM_PER_LATITUDE_DEGREE * Math.cos(Math.toRadians(centerLat)));

        return new double[]{
                centerLat - deltaLat,
                centerLat + deltaLat,
                centerLng - deltaLng,
                centerLng + deltaLng
        };
    }
}

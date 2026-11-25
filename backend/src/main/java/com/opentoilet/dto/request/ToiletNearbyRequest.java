package com.opentoilet.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ToiletNearbyRequest {

    // 사용자 현재 위도 (필수)
    @NotNull(message = "위도(latitude)는 필수 입력값입니다.")
    private Double lat;

    // 사용자 현재 경도 (필수)
    @NotNull(message = "경도(longitude)는 필수 입력값입니다.")
    private Double lng;

    // 탐색 반경 (미터 단위, 기본값 500m)
    private Integer radiusMeter = 500;

    // 현재 개방 중인 곳만 보기
    private Boolean onlyOpen = false;

    // 장애인 화장실 필터
    private Boolean hasDisabled = false;

    // 기저귀 교환대 필터
    private Boolean hasDiaper = false;

    // 휴지 비치 확인 필터
    private Boolean hasTissue = false;
}

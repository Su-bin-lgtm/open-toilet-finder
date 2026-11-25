package com.opentoilet.dto.response;

import com.opentoilet.entity.Toilet;
import com.opentoilet.entity.enums.HygieneStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class ToiletSummaryResponse {

    private Long id;
    private String name;
    private String address;
    private String lotAddress;
    private String facilityType;
    private Double latitude;
    private Double longitude;
    private Integer distanceMeter;
    private Boolean isOpenNow;
    private String openTimeInfo;
    private Boolean hasDisabledToilet;
    private Boolean hasDiaperTable;
    private Boolean hasTissue;
    private HygieneStatus hygieneStatus;

    // Entity와 계산된 거리를 받아 DTO로 변환
    public static ToiletSummaryResponse from(Toilet toilet, Integer distanceMeter, Boolean isOpenNow) {
        return ToiletSummaryResponse.builder()
                .id(toilet.getId())
                .name(toilet.getName())
                .address(toilet.getAddress())
                .lotAddress(toilet.getLotAddress())
                .facilityType(toilet.getFacilityType())
                .latitude(toilet.getLatitude())
                .longitude(toilet.getLongitude())
                .distanceMeter(distanceMeter)
                .isOpenNow(isOpenNow != null ? isOpenNow : toilet.getIsOpen24h())
                .openTimeInfo(toilet.getOpenTimeInfo())
                .hasDisabledToilet(toilet.getHasDisabledToilet())
                .hasDiaperTable(toilet.getHasDiaperTable())
                .hasTissue(toilet.getHasTissue())
                .hygieneStatus(toilet.getHygieneStatus())
                .build();
    }
}

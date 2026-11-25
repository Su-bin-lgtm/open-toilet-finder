package com.opentoilet.dto.response;

import com.opentoilet.entity.Toilet;
import com.opentoilet.entity.enums.HygieneStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
@AllArgsConstructor
public class ToiletDetailResponse {

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
    private String doorLockCode;
    private Boolean isUnisex;
    private Integer maleWaterClosetCount;
    private Integer maleUrinalCount;
    private Integer femaleWaterClosetCount;
    private Boolean hasDisabledToilet;
    private Boolean hasDiaperTable;
    private Boolean hasTissue;
    private HygieneStatus hygieneStatus;
    private Boolean emergencyBell;
    private Boolean cctvInstalled;
    private String managementAgency;
    private String phoneNumber;
    private List<ToiletReportResponse> recentReports;
    private LocalDateTime updatedAt;

    public static ToiletDetailResponse of(Toilet toilet, Integer distanceMeter, Boolean isOpenNow, List<ToiletReportResponse> recentReports) {
        return ToiletDetailResponse.builder()
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
                .doorLockCode(toilet.getDoorLockCode())
                .isUnisex(toilet.getIsUnisex())
                .maleWaterClosetCount(toilet.getMaleWaterClosetCount())
                .maleUrinalCount(toilet.getMaleUrinalCount())
                .femaleWaterClosetCount(toilet.getFemaleWaterClosetCount())
                .hasDisabledToilet(toilet.getHasDisabledToilet())
                .hasDiaperTable(toilet.getHasDiaperTable())
                .hasTissue(toilet.getHasTissue())
                .hygieneStatus(toilet.getHygieneStatus())
                .emergencyBell(toilet.getEmergencyBell())
                .cctvInstalled(toilet.getCctvInstalled())
                .managementAgency(toilet.getManagementAgency())
                .phoneNumber(toilet.getPhoneNumber())
                .recentReports(recentReports)
                .updatedAt(toilet.getUpdatedAt())
                .build();
    }
}

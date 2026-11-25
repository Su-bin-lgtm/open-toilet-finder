package com.opentoilet.dto.response;

import com.opentoilet.entity.ToiletReport;
import com.opentoilet.entity.enums.HygieneStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
@AllArgsConstructor
public class ToiletReportResponse {

    private Long id;
    private Boolean hasTissue;
    private HygieneStatus hygieneStatus;
    private Boolean isOpen;
    private String doorLockCode;
    private String comment;
    private LocalDateTime createdAt;

    public static ToiletReportResponse from(ToiletReport report) {
        return ToiletReportResponse.builder()
                .id(report.getId())
                .hasTissue(report.getHasTissue())
                .hygieneStatus(report.getHygieneStatus())
                .isOpen(report.getIsOpen())
                .doorLockCode(report.getDoorLockCode())
                .comment(report.getComment())
                .createdAt(report.getCreatedAt())
                .build();
    }
}

package com.opentoilet.dto.response;

import com.opentoilet.entity.ReportImage;

import java.time.LocalDateTime;

public record ReportImageResponse(Long id, String url, String mediaType, Long fileSize, LocalDateTime createdAt) {
    public static ReportImageResponse from(ReportImage image) {
        return new ReportImageResponse(image.getId(), "/api/v1/report-images/" + image.getId(),
                image.getMediaType(), image.getFileSize(), image.getCreatedAt());
    }
}

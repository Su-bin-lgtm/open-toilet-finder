package com.opentoilet.entity;

import com.opentoilet.entity.enums.ReportImageKind;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "report_image", indexes = {
        @Index(name = "idx_report_image_toilet_report", columnList = "toilet_report_id"),
        @Index(name = "idx_report_image_issue_report", columnList = "issue_report_id")
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ReportImage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "report_kind", nullable = false, length = 20)
    private ReportImageKind reportKind;

    @Column(name = "toilet_report_id")
    private Long toiletReportId;

    @Column(name = "issue_report_id")
    private Long issueReportId;

    @Column(name = "owner_user_id")
    private Long ownerUserId;

    @Column(name = "owner_fingerprint", length = 100)
    private String ownerFingerprint;

    @Column(name = "storage_key", nullable = false, unique = true, length = 50)
    private String storageKey;

    @Column(name = "media_type", nullable = false, length = 30)
    private String mediaType;

    @Column(name = "file_size", nullable = false)
    private Long fileSize;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public static ReportImage forToiletReport(Long reportId, Long ownerUserId, String ownerFingerprint,
                                               String storageKey, String mediaType, long fileSize) {
        return create(ReportImageKind.TOILET_STATUS, reportId, null, ownerUserId, ownerFingerprint,
                storageKey, mediaType, fileSize);
    }

    public static ReportImage forIssue(Long reportId, Long ownerUserId, String ownerFingerprint,
                                       String storageKey, String mediaType, long fileSize) {
        return create(ReportImageKind.ISSUE, null, reportId, ownerUserId, ownerFingerprint,
                storageKey, mediaType, fileSize);
    }

    private static ReportImage create(ReportImageKind kind, Long toiletReportId, Long issueReportId,
                                      Long ownerUserId, String ownerFingerprint, String storageKey,
                                      String mediaType, long fileSize) {
        ReportImage image = new ReportImage();
        image.reportKind = kind;
        image.toiletReportId = toiletReportId;
        image.issueReportId = issueReportId;
        image.ownerUserId = ownerUserId;
        image.ownerFingerprint = ownerFingerprint;
        image.storageKey = storageKey;
        image.mediaType = mediaType;
        image.fileSize = fileSize;
        return image;
    }

    @PrePersist
    void prePersist() {
        createdAt = LocalDateTime.now();
    }
}

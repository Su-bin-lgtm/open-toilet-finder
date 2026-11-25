package com.opentoilet.dto.response;

import com.opentoilet.entity.IssueReport;
import com.opentoilet.entity.ToiletReport;
import com.opentoilet.entity.enums.IssueStatus;

import java.time.LocalDateTime;

public record MyReportResponse(
        Long id,
        String reportKind,
        ToiletReferenceResponse toilet,
        String type,
        String content,
        IssueStatus status,
        LocalDateTime createdAt,
        String reviewMemo,
        LocalDateTime reviewedAt
) {
    public static MyReportResponse from(ToiletReport report) {
        String comment = report.getComment() == null ? "" : report.getComment().trim();
        String type = "현장 상태 제보";
        String content = comment;
        if (comment.startsWith("[") && comment.contains("]")) {
            int end = comment.indexOf(']');
            type = comment.substring(1, end).trim();
            content = comment.substring(end + 1).trim();
        }
        if (content.isBlank()) {
            content = String.format("휴지 %s · 위생 %s · 출입문 %s",
                    Boolean.TRUE.equals(report.getHasTissue()) ? "있음" : "없음",
                    report.getHygieneStatus() == null ? "미기록" : report.getHygieneStatus().name(),
                    Boolean.TRUE.equals(report.getIsOpen()) ? "열림" : "닫힘");
        }
        return new MyReportResponse(report.getId(), "TOILET_STATUS",
                ToiletReferenceResponse.from(report.getToilet()), type, content, null, report.getCreatedAt(), null, null);
    }

    public static MyReportResponse from(IssueReport report) {
        return new MyReportResponse(report.getId(), "ISSUE",
                ToiletReferenceResponse.from(report.getToilet()), report.getIssueType().getDescription(), report.getContent(),
                report.getStatus(), report.getCreatedAt(), report.getReviewMemo(), report.getReviewedAt());
    }
}

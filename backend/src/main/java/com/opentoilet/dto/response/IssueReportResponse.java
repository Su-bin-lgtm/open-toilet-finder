package com.opentoilet.dto.response;

import com.opentoilet.entity.IssueReport;
import com.opentoilet.entity.enums.IssueStatus;
import com.opentoilet.entity.enums.IssueType;

import java.time.LocalDateTime;

public record IssueReportResponse(
        Long id,
        ToiletReferenceResponse toilet,
        IssueType issueType,
        String content,
        IssueStatus status,
        LocalDateTime createdAt,
        String reviewMemo,
        LocalDateTime reviewedAt
) {
    public static IssueReportResponse from(IssueReport issue) {
        return new IssueReportResponse(
                issue.getId(),
                ToiletReferenceResponse.from(issue.getToilet()),
                issue.getIssueType(),
                issue.getContent(),
                issue.getStatus(),
                issue.getCreatedAt(),
                issue.getReviewMemo(),
                issue.getReviewedAt()
        );
    }
}

package com.opentoilet.entity;

import com.opentoilet.entity.enums.IssueStatus;
import com.opentoilet.entity.enums.IssueType;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "issue_report")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class IssueReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 신고 대상 화장실
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "toilet_id", nullable = false)
    private Toilet toilet;

    // 신고 유형
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private IssueType issueType;

    // 신고 내용
    @Column(nullable = false, length = 500)
    private String content;

    // 비식별 단말 식별자 (로그인 전 기기별 제보 조회용)
    @Column(length = 100)
    private String userFingerprint;

    @Column(name = "user_id")
    private Long userId;

    // 조치 상태
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private IssueStatus status = IssueStatus.RECEIVED;

    @Column(length = 500)
    private String reviewMemo;

    private LocalDateTime reviewedAt;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
    }

    public void updateStatus(IssueStatus status) {
        this.status = status;
    }

    public void review(IssueStatus status, String reviewMemo) {
        this.status = status;
        this.reviewMemo = reviewMemo == null || reviewMemo.isBlank() ? null : reviewMemo.trim();
        this.reviewedAt = LocalDateTime.now();
    }

    public void assignUser(Long userId) { this.userId = userId; }
}

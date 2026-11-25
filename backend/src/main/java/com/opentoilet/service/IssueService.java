package com.opentoilet.service;

import com.opentoilet.dto.request.IssueReportCreateRequest;
import com.opentoilet.dto.request.IssueReviewRequest;
import com.opentoilet.entity.IssueReport;
import com.opentoilet.entity.Toilet;
import com.opentoilet.entity.enums.IssueStatus;
import com.opentoilet.repository.IssueReportRepository;
import com.opentoilet.repository.ToiletRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Isolation;

import java.util.List;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class IssueService {

    private final ToiletRepository toiletRepository;
    private final IssueReportRepository issueReportRepository;

    // 오류 신고 접수
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public Long createIssue(Long toiletId, IssueReportCreateRequest request, String userFingerprint, Long userId) {
        validateFingerprint(userFingerprint);
        Toilet toilet = toiletRepository.findByIdForUpdate(toiletId)
                .orElseThrow(() -> new IllegalArgumentException("해당 화장실을 찾을 수 없습니다. (id: " + toiletId + ")"));

        String fingerprint = normalizeFingerprint(userFingerprint);
        if (fingerprint != null && issueReportRepository.existsByToiletIdAndUserFingerprintAndCreatedAtAfter(
                toiletId, fingerprint, LocalDateTime.now().minusMinutes(10))) {
            throw new IllegalStateException("잠시 전에 이미 오류 신고를 등록하셨습니다. 10분 후에 다시 등록해 주세요.");
        }

        IssueReport issue = IssueReport.builder()
                .toilet(toilet)
                .issueType(request.getIssueType())
                .content(request.getContent())
                .userFingerprint(fingerprint)
                .userId(userId)
                .status(IssueStatus.RECEIVED)
                .build();

        return issueReportRepository.save(issue).getId();
    }

    // 오류 신고 처리 상태 업데이트 (관리자용)
    @Transactional
    public void updateIssueStatus(Long issueId, IssueStatus newStatus, IssueReviewRequest reviewRequest) {
        IssueReport issue = issueReportRepository.findById(issueId)
                .orElseThrow(() -> new IllegalArgumentException("해당 오류 신고 건을 찾을 수 없습니다. (id: " + issueId + ")"));
        IssueReviewRequest review = reviewRequest == null ? new IssueReviewRequest() : reviewRequest;
        if (review.getToiletUpdates() != null && review.getToiletUpdates().hasChanges()) {
            if (newStatus != IssueStatus.RESOLVED) {
                throw new IllegalStateException("화장실 정보 반영은 승인(RESOLVED) 처리에서만 가능합니다.");
            }
            var update = review.getToiletUpdates();
            issue.getToilet().updateVerifiedInformation(update.getHasTissue(), update.getHasDisabledToilet(),
                    update.getHasDiaperTable(), update.getIsUnisex(), update.getOpenTimeInfo(), update.getDoorLockCode());
        }
        issue.review(newStatus, review.getReviewMemo());
    }

    // 상태별 오류 신고 목록 조회
    public List<IssueReport> getIssues(IssueStatus status) {
        if (status == null) {
            return issueReportRepository.findAllByOrderByCreatedAtDesc();
        }
        return issueReportRepository.findByStatusOrderByCreatedAtDesc(status);
    }

    private void validateFingerprint(String fingerprint) {
        if (fingerprint != null && fingerprint.length() > 100) {
            throw new IllegalStateException("X-Device-Id는 100자 이하여야 합니다.");
        }
    }

    private String normalizeFingerprint(String fingerprint) {
        return fingerprint == null || fingerprint.isBlank() ? null : fingerprint.trim();
    }
}

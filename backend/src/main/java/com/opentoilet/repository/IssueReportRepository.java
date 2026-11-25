package com.opentoilet.repository;

import com.opentoilet.entity.IssueReport;
import com.opentoilet.entity.enums.IssueStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.time.LocalDateTime;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;

@Repository
public interface IssueReportRepository extends JpaRepository<IssueReport, Long> {

    @EntityGraph(attributePaths = "toilet")
    Optional<IssueReport> findWithToiletById(Long id);

    // 특정 화장실의 신고 목록 최신순 조회
    List<IssueReport> findByToiletIdOrderByCreatedAtDesc(Long toiletId);

    // 처리 상태별 신고 목록 최신순 조회 (관리자용)
    List<IssueReport> findByStatusOrderByCreatedAtDesc(IssueStatus status);

    // 전체 신고 목록 최신순 조회
    List<IssueReport> findAllByOrderByCreatedAtDesc();

    List<IssueReport> findTop100ByUserFingerprintOrderByCreatedAtDesc(String userFingerprint);

    boolean existsByToiletIdAndUserFingerprintAndCreatedAtAfter(Long toiletId, String userFingerprint, LocalDateTime createdAt);

    List<IssueReport> findTop100ByUserIdOrderByCreatedAtDesc(Long userId);
}

package com.opentoilet.repository;

import com.opentoilet.entity.ToiletReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.time.LocalDateTime;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;

@Repository
public interface ToiletReportRepository extends JpaRepository<ToiletReport, Long> {

    @EntityGraph(attributePaths = "toilet")
    Optional<ToiletReport> findWithToiletById(Long id);

    // 특정 화장실의 최근 제보 5건 최신순 조회
    List<ToiletReport> findTop5ByToiletIdOrderByCreatedAtDesc(Long toiletId);

    // 특정 화장실의 전체 제보 목록 최신순 조회
    List<ToiletReport> findByToiletIdOrderByCreatedAtDesc(Long toiletId);

    List<ToiletReport> findTop100ByUserFingerprintOrderByCreatedAtDesc(String userFingerprint);

    boolean existsByToiletIdAndUserFingerprintAndCreatedAtAfter(Long toiletId, String userFingerprint, LocalDateTime createdAt);

    List<ToiletReport> findTop100ByUserIdOrderByCreatedAtDesc(Long userId);
}

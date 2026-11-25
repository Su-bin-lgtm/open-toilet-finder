package com.opentoilet.service;

import com.opentoilet.dto.request.ToiletReportCreateRequest;
import com.opentoilet.dto.response.ToiletReportResponse;
import com.opentoilet.entity.Toilet;
import com.opentoilet.entity.ToiletReport;
import com.opentoilet.repository.ToiletReportRepository;
import com.opentoilet.repository.ToiletRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Isolation;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReportService {

    private final ToiletRepository toiletRepository;
    private final ToiletReportRepository toiletReportRepository;

    // 화장실 상태 제보 등록 및 마스터 정보 실시간 갱신
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public Long createReport(Long toiletId, ToiletReportCreateRequest request, String userFingerprint, Long userId) {
        if (userFingerprint != null && userFingerprint.length() > 100) {
            throw new IllegalStateException("X-Device-Id는 100자 이하여야 합니다.");
        }
        String fingerprint = userFingerprint == null || userFingerprint.isBlank() ? null : userFingerprint.trim();
        Toilet toilet = toiletRepository.findByIdForUpdate(toiletId)
                .orElseThrow(() -> new IllegalArgumentException("해당 화장실을 찾을 수 없습니다. (id: " + toiletId + ")"));

        // 동일 사용자의 10분 이내 연속 중복 제보 방지
        if (fingerprint != null && toiletReportRepository.existsByToiletIdAndUserFingerprintAndCreatedAtAfter(
                toiletId, fingerprint, LocalDateTime.now().minusMinutes(10))) {
            throw new IllegalStateException("잠시 전에 이미 제보를 등록하셨습니다. 10분 후에 다시 등록해 주세요.");
        }

        ToiletReport report = ToiletReport.builder()
                .toilet(toilet)
                .hasTissue(request.getHasTissue())
                .hygieneStatus(request.getHygieneStatus())
                .isOpen(request.getIsOpen())
                .doorLockCode(request.getDoorLockCode())
                .comment(request.getComment())
                .userFingerprint(fingerprint)
                .userId(userId)
                .build();

        ToiletReport savedReport = toiletReportRepository.save(report);

        toilet.updateStatusFromReport(
                request.getHasTissue(),
                request.getHygieneStatus(),
                request.getDoorLockCode()
        );

        return savedReport.getId();
    }

    // 화장실별 제보 내역 목록 조회
    public List<ToiletReportResponse> getReports(Long toiletId) {
        return toiletReportRepository.findByToiletIdOrderByCreatedAtDesc(toiletId)
                .stream()
                .map(ToiletReportResponse::from)
                .collect(Collectors.toList());
    }
}

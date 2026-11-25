package com.opentoilet.service;

import com.opentoilet.dto.response.MyReportResponse;
import com.opentoilet.repository.IssueReportRepository;
import com.opentoilet.repository.ToiletReportRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MyReportService {

    private final ToiletReportRepository toiletReportRepository;
    private final IssueReportRepository issueReportRepository;

    public List<MyReportResponse> findByDeviceId(String deviceId) {
        if (deviceId == null || deviceId.isBlank() || deviceId.length() > 100) {
            throw new IllegalStateException("유효한 X-Device-Id가 필요합니다. (1~100자)");
        }

        String fingerprint = deviceId.trim();
        return Stream.concat(
                        toiletReportRepository.findTop100ByUserFingerprintOrderByCreatedAtDesc(fingerprint)
                                .stream().map(MyReportResponse::from),
                        issueReportRepository.findTop100ByUserFingerprintOrderByCreatedAtDesc(fingerprint)
                                .stream().map(MyReportResponse::from))
                .sorted(Comparator.comparing(MyReportResponse::createdAt).reversed())
                .limit(100)
                .toList();
    }

    public List<MyReportResponse> findByUserId(Long userId) {
        if (userId == null) throw new IllegalArgumentException("인증된 계정이 필요합니다.");
        return Stream.concat(
                        toiletReportRepository.findTop100ByUserIdOrderByCreatedAtDesc(userId).stream().map(MyReportResponse::from),
                        issueReportRepository.findTop100ByUserIdOrderByCreatedAtDesc(userId).stream().map(MyReportResponse::from))
                .sorted(Comparator.comparing(MyReportResponse::createdAt).reversed())
                .limit(100)
                .toList();
    }
}

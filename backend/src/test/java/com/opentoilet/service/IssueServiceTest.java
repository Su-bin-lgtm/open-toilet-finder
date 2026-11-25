package com.opentoilet.service;

import com.opentoilet.dto.request.IssueReportCreateRequest;
import com.opentoilet.entity.Toilet;
import com.opentoilet.entity.IssueReport;
import com.opentoilet.entity.enums.IssueType;
import com.opentoilet.repository.IssueReportRepository;
import com.opentoilet.repository.ToiletRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class IssueServiceTest {
    @Mock private ToiletRepository toiletRepository;
    @Mock private IssueReportRepository issueReportRepository;
    @InjectMocks private IssueService issueService;

    @Test
    void blocksSameDeviceIssueForSameToiletWithinTenMinutes() {
        Toilet toilet = Toilet.builder().id(7L).name("개발 테스트 화장실").address("개발 DB")
                .latitude(37.5).longitude(127.0).build();
        IssueReportCreateRequest request = new IssueReportCreateRequest();
        request.setIssueType(IssueType.OTHER);
        request.setContent("[DEVTEST] 반복 신고 방지 확인");
        given(toiletRepository.findByIdForUpdate(7L)).willReturn(Optional.of(toilet));
        given(issueReportRepository.existsByToiletIdAndUserFingerprintAndCreatedAtAfter(
                eq(7L), eq("device-a"), any())).willReturn(true);

        assertThrows(IllegalStateException.class, () -> issueService.createIssue(7L, request, "device-a", null));
        verify(issueReportRepository, never()).save(any());
    }

    @Test
    void permitsIssueWhenDeviceHasNoRecentIssueForToilet() {
        Toilet toilet = Toilet.builder().id(7L).name("개발 테스트 화장실").address("개발 DB")
                .latitude(37.5).longitude(127.0).build();
        IssueReportCreateRequest request = new IssueReportCreateRequest();
        request.setIssueType(IssueType.OTHER);
        request.setContent("[DEVTEST] 첫 신고");
        given(toiletRepository.findByIdForUpdate(7L)).willReturn(Optional.of(toilet));
        given(issueReportRepository.existsByToiletIdAndUserFingerprintAndCreatedAtAfter(
                eq(7L), eq("device-a"), any())).willReturn(false);
        given(issueReportRepository.save(any(IssueReport.class))).willReturn(IssueReport.builder().id(99L).build());

        org.junit.jupiter.api.Assertions.assertEquals(99L, issueService.createIssue(7L, request, "device-a", null));
        verify(issueReportRepository).save(any());
    }
}

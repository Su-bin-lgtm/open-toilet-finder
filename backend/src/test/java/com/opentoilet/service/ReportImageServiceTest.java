package com.opentoilet.service;

import com.opentoilet.entity.Toilet;
import com.opentoilet.entity.ToiletReport;
import com.opentoilet.repository.IssueReportRepository;
import com.opentoilet.repository.ReportImageRepository;
import com.opentoilet.repository.ToiletReportRepository;
import com.opentoilet.security.AppUserPrincipal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.support.TransactionTemplate;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

class ReportImageServiceTest {
    private ToiletReportRepository toiletReports;
    private ImageStorage storage;
    private ReportImageService service;

    @BeforeEach
    void setUp() {
        toiletReports = mock(ToiletReportRepository.class);
        storage = mock(ImageStorage.class);
        service = new ReportImageService(toiletReports, mock(IssueReportRepository.class),
                mock(ReportImageRepository.class), storage, mock(TransactionTemplate.class));
    }

    @Test
    void rejectsNonImageBytesEvenWhenMimeTypeClaimsPng() {
        Toilet toilet = mock(Toilet.class);
        when(toilet.getId()).thenReturn(9L);
        ToiletReport report = ToiletReport.builder().toilet(toilet).userFingerprint("device-owner").build();
        when(toiletReports.findWithToiletById(4L)).thenReturn(java.util.Optional.of(report));
        MockMultipartFile file = new MockMultipartFile("file", "fake.png", "image/png", "not-an-image".getBytes());

        assertThrows(IllegalStateException.class,
                () -> service.uploadToiletReport(9L, 4L, file, "device-owner", null));
        verify(storage, never()).store(any(), anyString());
    }

    @Test
    void rejectsUploadFromAnotherDevice() {
        Toilet toilet = mock(Toilet.class);
        when(toilet.getId()).thenReturn(9L);
        ToiletReport report = ToiletReport.builder().toilet(toilet).userFingerprint("device-owner").build();
        when(toiletReports.findWithToiletById(4L)).thenReturn(java.util.Optional.of(report));
        MockMultipartFile file = new MockMultipartFile("file", "valid.png", "image/png", new byte[8]);

        assertThrows(AccessDeniedException.class,
                () -> service.uploadToiletReport(9L, 4L, file, "different-device", (Authentication) null));
        verify(storage, never()).store(any(), anyString());
    }

    @Test
    void rejectsAnotherAccountEvenWhenDeviceFingerprintMatches() {
        ToiletReport report = ToiletReport.builder()
                .userId(1L)
                .userFingerprint("device-owner")
                .build();
        when(toiletReports.findById(4L)).thenReturn(java.util.Optional.of(report));
        Authentication authentication = mock(Authentication.class);
        when(authentication.getPrincipal()).thenReturn(new AppUserPrincipal(2L, "other-user", "token-hash"));

        assertThrows(AccessDeniedException.class,
                () -> service.listForToiletReport(4L, "device-owner", authentication));
    }
}

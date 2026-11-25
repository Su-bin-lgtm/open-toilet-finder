package com.opentoilet.service;

import com.opentoilet.dto.response.ReportImageResponse;
import com.opentoilet.entity.IssueReport;
import com.opentoilet.entity.ReportImage;
import com.opentoilet.entity.ToiletReport;
import com.opentoilet.repository.IssueReportRepository;
import com.opentoilet.repository.ReportImageRepository;
import com.opentoilet.repository.ToiletReportRepository;
import com.opentoilet.security.AppUserPrincipal;
import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.stream.ImageInputStream;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.Iterator;
import java.util.List;

@Service
public class ReportImageService {
    public static final long MAX_SIZE = 10L * 1024 * 1024;
    private final ToiletReportRepository toiletReports;
    private final IssueReportRepository issueReports;
    private final ReportImageRepository images;
    private final ImageStorage storage;
    private final TransactionTemplate transactionTemplate;

    public ReportImageService(ToiletReportRepository toiletReports, IssueReportRepository issueReports,
                              ReportImageRepository images, ImageStorage storage,
                              TransactionTemplate transactionTemplate) {
        this.toiletReports = toiletReports;
        this.issueReports = issueReports;
        this.images = images;
        this.storage = storage;
        this.transactionTemplate = transactionTemplate;
    }

    public ReportImageResponse uploadToiletReport(Long toiletId, Long reportId, MultipartFile file,
                                                   String deviceId, Authentication authentication) {
        ToiletReport report = toiletReports.findWithToiletById(reportId)
                .orElseThrow(() -> new IllegalArgumentException("현장 제보를 찾을 수 없습니다."));
        if (!report.getToilet().getId().equals(toiletId)) throw new IllegalArgumentException("제보 대상 화장실이 일치하지 않습니다.");
        requireOwner(report.getUserId(), report.getUserFingerprint(), deviceId, authentication);
        return store(file, ReportImage.forToiletReport(reportId, report.getUserId(), report.getUserFingerprint(),
                "", "", 0));
    }

    public ReportImageResponse uploadIssue(Long toiletId, Long reportId, MultipartFile file,
                                           String deviceId, Authentication authentication) {
        IssueReport report = issueReports.findWithToiletById(reportId)
                .orElseThrow(() -> new IllegalArgumentException("오류 신고를 찾을 수 없습니다."));
        if (!report.getToilet().getId().equals(toiletId)) throw new IllegalArgumentException("제보 대상 화장실이 일치하지 않습니다.");
        requireOwner(report.getUserId(), report.getUserFingerprint(), deviceId, authentication);
        return store(file, ReportImage.forIssue(reportId, report.getUserId(), report.getUserFingerprint(),
                "", "", 0));
    }

    public List<ReportImageResponse> listForToiletReport(Long reportId, String deviceId, Authentication authentication) {
        ToiletReport report = toiletReports.findById(reportId)
                .orElseThrow(() -> new IllegalArgumentException("현장 제보를 찾을 수 없습니다."));
        requireOwner(report.getUserId(), report.getUserFingerprint(), deviceId, authentication);
        return images.findByToiletReportIdOrderByCreatedAtAsc(reportId).stream().map(ReportImageResponse::from).toList();
    }

    public List<ReportImageResponse> listForIssue(Long reportId, String deviceId, Authentication authentication) {
        IssueReport report = issueReports.findById(reportId)
                .orElseThrow(() -> new IllegalArgumentException("오류 신고를 찾을 수 없습니다."));
        requireOwner(report.getUserId(), report.getUserFingerprint(), deviceId, authentication);
        return images.findByIssueReportIdOrderByCreatedAtAsc(reportId).stream().map(ReportImageResponse::from).toList();
    }

    public StoredImage read(Long imageId, String deviceId, Authentication authentication) {
        ReportImage image = images.findById(imageId)
                .orElseThrow(() -> new IllegalArgumentException("이미지를 찾을 수 없습니다."));
        requireOwner(image.getOwnerUserId(), image.getOwnerFingerprint(), deviceId, authentication);
        try {
            return new StoredImage(storage.read(image.getStorageKey()), image.getMediaType());
        } catch (ImageStorageException ex) {
            throw new IllegalStateException("저장된 이미지를 불러오지 못했습니다.");
        }
    }

    private ReportImageResponse store(MultipartFile file, ReportImage template) {
        ValidatedImage validated = validate(file);
        String key = storage.store(validated.bytes(), validated.extension());
        try {
            ReportImage image = transactionTemplate.execute(status -> {
                ReportImage entity = template.getReportKind().name().equals("TOILET_STATUS")
                        ? ReportImage.forToiletReport(template.getToiletReportId(), template.getOwnerUserId(),
                        template.getOwnerFingerprint(), key, validated.mediaType(), validated.bytes().length)
                        : ReportImage.forIssue(template.getIssueReportId(), template.getOwnerUserId(),
                        template.getOwnerFingerprint(), key, validated.mediaType(), validated.bytes().length);
                return images.saveAndFlush(entity);
            });
            if (image == null) throw new IllegalStateException("이미지 정보를 저장하지 못했습니다.");
            return ReportImageResponse.from(image);
        } catch (RuntimeException ex) {
            storage.delete(key);
            throw ex;
        }
    }

    private ValidatedImage validate(MultipartFile file) {
        if (file == null || file.isEmpty()) throw new IllegalStateException("이미지 파일을 선택해 주세요.");
        if (file.getSize() > MAX_SIZE) throw new IllegalStateException("이미지는 10MB 이하여야 합니다.");
        try {
            byte[] bytes = file.getBytes();
            if (bytes.length < 8) throw new IllegalStateException("올바른 JPEG 또는 PNG 이미지가 아닙니다.");
            String extension;
            String mediaType;
            if (isPng(bytes)) {
                extension = ".png";
                mediaType = "image/png";
            } else if (isJpeg(bytes)) {
                extension = ".jpg";
                mediaType = "image/jpeg";
            } else {
                throw new IllegalStateException("JPEG 또는 PNG 이미지 파일만 업로드할 수 있습니다.");
            }
            verifyImage(bytes);
            return new ValidatedImage(bytes, extension, mediaType);
        } catch (IOException ex) {
            throw new ImageStorageException("업로드한 이미지 파일을 읽지 못했습니다.", ex);
        }
    }

    private void verifyImage(byte[] bytes) throws IOException {
        try (ImageInputStream input = ImageIO.createImageInputStream(new ByteArrayInputStream(bytes))) {
            if (input == null) throw new IllegalStateException("올바른 이미지 파일이 아닙니다.");
            Iterator<ImageReader> readers = ImageIO.getImageReaders(input);
            if (!readers.hasNext()) throw new IllegalStateException("손상되었거나 지원하지 않는 이미지입니다.");
            ImageReader reader = readers.next();
            try {
                reader.setInput(input, true, true);
                int width = reader.getWidth(0);
                int height = reader.getHeight(0);
                if (width < 1 || height < 1 || (long) width * height > 40_000_000L) {
                    throw new IllegalStateException("이미지 해상도가 허용 범위를 초과합니다.");
                }
                if (reader.read(0) == null) throw new IllegalStateException("손상된 이미지입니다.");
            } finally {
                reader.dispose();
            }
        }
    }

    private void requireOwner(Long ownerUserId, String ownerFingerprint, String deviceId, Authentication authentication) {
        if (isAdmin(authentication)) return;
        Long authenticatedUserId = authentication != null && authentication.getPrincipal() instanceof AppUserPrincipal user
                ? user.id() : null;
        if (ownerUserId != null) {
            if (authenticatedUserId != null && authenticatedUserId.equals(ownerUserId)) return;
            throw new AccessDeniedException("이 제보 이미지에 접근할 권한이 없습니다.");
        }
        String fingerprint = normalize(deviceId);
        if (fingerprint != null && fingerprint.equals(ownerFingerprint)) return;
        throw new AccessDeniedException("이 제보 이미지에 접근할 권한이 없습니다.");
    }

    private boolean isAdmin(Authentication authentication) {
        return authentication != null && authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority).anyMatch("ROLE_ADMIN"::equals);
    }

    private String normalize(String value) {
        if (value == null || value.isBlank()) return null;
        String trimmed = value.trim();
        if (trimmed.length() > 100) throw new IllegalStateException("X-Device-Id는 100자 이하여야 합니다.");
        return trimmed;
    }

    private boolean isPng(byte[] bytes) {
        byte[] signature = {(byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A};
        for (int i = 0; i < signature.length; i++) if (bytes[i] != signature[i]) return false;
        return true;
    }

    private boolean isJpeg(byte[] bytes) {
        return (bytes[0] & 0xff) == 0xff && (bytes[1] & 0xff) == 0xd8 && (bytes[2] & 0xff) == 0xff;
    }

    private record ValidatedImage(byte[] bytes, String extension, String mediaType) { }
    public record StoredImage(byte[] content, String mediaType) { }
}

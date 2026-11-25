package com.opentoilet.repository;

import com.opentoilet.entity.ReportImage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReportImageRepository extends JpaRepository<ReportImage, Long> {
    List<ReportImage> findByToiletReportIdOrderByCreatedAtAsc(Long reportId);
    List<ReportImage> findByIssueReportIdOrderByCreatedAtAsc(Long reportId);
}

package com.opentoilet.dto.request;

import com.opentoilet.entity.enums.IssueType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class IssueReportCreateRequest {

    // 신고 유형
    @NotNull(message = "신고 유형은 필수입니다.")
    private IssueType issueType;

    // 상세 내용
    @NotBlank(message = "신고 상세 내용을 입력해주세요.")
    private String content;
}

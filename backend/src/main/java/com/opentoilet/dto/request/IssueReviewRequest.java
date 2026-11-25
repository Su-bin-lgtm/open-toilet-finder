package com.opentoilet.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class IssueReviewRequest {
    @Size(max = 500, message = "처리 메모는 500자 이하여야 합니다.")
    private String reviewMemo;

    @Valid
    private ToiletVerifiedUpdateRequest toiletUpdates;
}

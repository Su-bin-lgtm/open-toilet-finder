package com.opentoilet.dto.request;

import com.opentoilet.entity.enums.HygieneStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ToiletReportCreateRequest {

    // 휴지 비치 여부
    @NotNull(message = "휴지 유무는 필수 선택 항목입니다.")
    private Boolean hasTissue;

    // 위생 상태 (CLEAN, NORMAL, DIRTY)
    @NotNull(message = "위생 상태는 필수 선택 항목입니다.")
    private HygieneStatus hygieneStatus;

    // 출입문 개방 여부
    @NotNull(message = "문 개방 여부는 필수 선택 항목입니다.")
    private Boolean isOpen;

    // 도어락 비밀번호 (선택)
    private String doorLockCode;

    // 추가 현장 메모
    private String comment;
}

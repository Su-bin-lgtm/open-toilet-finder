package com.opentoilet.dto.request;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ToiletVerifiedUpdateRequest {
    private Boolean hasTissue;
    private Boolean hasDisabledToilet;
    private Boolean hasDiaperTable;
    private Boolean isUnisex;

    @Size(max = 150, message = "운영시간은 150자 이하여야 합니다.")
    private String openTimeInfo;

    @Size(max = 100, message = "출입 안내는 100자 이하여야 합니다.")
    private String doorLockCode;

    public boolean hasChanges() {
        return hasTissue != null || hasDisabledToilet != null || hasDiaperTable != null
                || isUnisex != null || openTimeInfo != null || doorLockCode != null;
    }
}

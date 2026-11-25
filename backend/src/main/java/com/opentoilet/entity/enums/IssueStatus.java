package com.opentoilet.entity.enums;

// 오류 신고 처리 상태 구분
public enum IssueStatus {
    RECEIVED("접수됨"),
    IN_PROGRESS("확인 중"),
    RESOLVED("조치 완료"),
    REJECTED("반려됨");

    private final String description;

    IssueStatus(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}

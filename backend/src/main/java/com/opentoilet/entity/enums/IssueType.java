package com.opentoilet.entity.enums;

// 오류 신고 유형 구분
public enum IssueType {
    CLOSED("폐쇄 또는 철거됨"),
    WRONG_LOCATION("위치가 실제와 다름"),
    WRONG_PASSWORD("도어락 비밀번호가 틀림"),
    OTHER("기타 불편 사항");

    private final String description;

    IssueType(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}

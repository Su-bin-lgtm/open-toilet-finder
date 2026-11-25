package com.opentoilet.entity.enums;

// 데이터 출처 구분
public enum SourceType {
    PUBLIC_DATA("공공데이터 포털"),
    USER_REGISTERED("사용자 직접 등록");

    private final String description;

    SourceType(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}

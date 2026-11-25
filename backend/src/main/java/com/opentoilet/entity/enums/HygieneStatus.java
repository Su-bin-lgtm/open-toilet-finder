package com.opentoilet.entity.enums;

// 화장실 위생 상태 구분
public enum HygieneStatus {
    CLEAN("청결함"),
    NORMAL("보통"),
    DIRTY("청소 필요");

    private final String description;

    HygieneStatus(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}

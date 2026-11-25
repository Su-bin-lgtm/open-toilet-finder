package com.opentoilet.entity;

import com.opentoilet.entity.enums.HygieneStatus;
import com.opentoilet.entity.enums.SourceType;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "toilet", indexes = {
        @Index(name = "idx_toilet_location", columnList = "latitude, longitude"),
        @Index(name = "uk_toilet_source_record", columnList = "source_system, source_record_id", unique = true)
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Toilet {

    // 기본키 (자동 증가 식별자)
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 화장실 명칭
    @Column(nullable = false, length = 100)
    private String name;

    // 도로명 또는 지번 주소
    @Column(nullable = false, length = 255)
    private String address;

    // WGS84 위도
    @Column(nullable = true)
    private Double latitude;

    // WGS84 경도
    @Column(nullable = true)
    private Double longitude;

    // 공공데이터 원천의 지번 주소와 분류. 기존 주소는 도로명 우선 표시용이다.
    @Column(length = 255)
    private String lotAddress;

    @Column(length = 100)
    private String facilityType;

    @Column(length = 20)
    private String openingAuthorityCode;

    // 원천 레코드의 식별 및 갱신 추적 정보
    @Column(length = 50)
    private String sourceSystem;

    @Column(length = 100)
    private String sourceRecordId;

    @Column(length = 10)
    private String dataBaseDate;

    @Column(length = 20)
    private String sourceUpdatedAt;

    @Column(columnDefinition = "longtext")
    private String sourcePayload;

    // 개방 시간 안내 (예: "24시간", "09:00 ~ 18:00")
    @Column(length = 150)
    private String openTimeInfo;

    // 24시간 상시 개방 여부
    @Builder.Default
    private Boolean isOpen24h = false;

    // 도어락 비밀번호 또는 출입 안내 문구
    @Column(length = 100)
    private String doorLockCode;

    // 남녀 공용 여부
    @Builder.Default
    private Boolean isUnisex = false;

    // 남성용 대변기 수
    @Builder.Default
    private Integer maleWaterClosetCount = 0;

    // 남성용 소변기 수
    @Builder.Default
    private Integer maleUrinalCount = 0;

    // 여성용 대변기 수
    @Builder.Default
    private Integer femaleWaterClosetCount = 0;

    // 장애인 화장실 설치 유무
    @Builder.Default
    private Boolean hasDisabledToilet = false;

    // 기저귀 교환대 설치 유무
    @Builder.Default
    private Boolean hasDiaperTable = false;

    // 휴지 비치 여부
    @Builder.Default
    private Boolean hasTissue = true;

    // 위생 상태 (CLEAN, NORMAL, DIRTY)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private HygieneStatus hygieneStatus = HygieneStatus.CLEAN;

    // 비상벨 설치 여부
    @Builder.Default
    private Boolean emergencyBell = false;

    // CCTV 설치 여부
    @Builder.Default
    private Boolean cctvInstalled = false;

    // 관리 기관명
    @Column(length = 100)
    private String managementAgency;

    // 관리처 연락처
    @Column(length = 30)
    private String phoneNumber;

    // 데이터 출처 (PUBLIC_DATA, USER_REGISTERED)
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private SourceType sourceType = SourceType.PUBLIC_DATA;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // 제보 내용 기반 상태 최신화
    public void updateStatusFromReport(Boolean hasTissue, HygieneStatus hygieneStatus, String doorLockCode) {
        if (hasTissue != null) {
            this.hasTissue = hasTissue;
        }
        if (hygieneStatus != null) {
            this.hygieneStatus = hygieneStatus;
        }
        if (doorLockCode != null && !doorLockCode.isBlank()) {
            this.doorLockCode = doorLockCode;
        }
        this.updatedAt = LocalDateTime.now();
    }

    public void updateVerifiedInformation(Boolean hasTissue, Boolean hasDisabledToilet, Boolean hasDiaperTable,
                                          Boolean isUnisex, String openTimeInfo, String doorLockCode) {
        if (hasTissue != null) this.hasTissue = hasTissue;
        if (hasDisabledToilet != null) this.hasDisabledToilet = hasDisabledToilet;
        if (hasDiaperTable != null) this.hasDiaperTable = hasDiaperTable;
        if (isUnisex != null) this.isUnisex = isUnisex;
        if (openTimeInfo != null) {
            this.openTimeInfo = openTimeInfo.trim();
            this.isOpen24h = this.openTimeInfo.contains("24시간") || this.openTimeInfo.contains("상시");
        }
        if (doorLockCode != null) this.doorLockCode = doorLockCode.trim();
        this.updatedAt = LocalDateTime.now();
    }
}

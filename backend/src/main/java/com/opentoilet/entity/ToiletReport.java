package com.opentoilet.entity;

import com.opentoilet.entity.enums.HygieneStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "toilet_report", indexes = {
        @Index(name = "idx_report_toilet_created", columnList = "toilet_id, createdAt")
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class ToiletReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 제보 대상 화장실
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "toilet_id", nullable = false)
    private Toilet toilet;

    // 휴지 유무
    @Column(nullable = false)
    private Boolean hasTissue;

    // 위생 상태
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private HygieneStatus hygieneStatus;

    // 출입문 개방 상태
    @Column(nullable = false)
    private Boolean isOpen;

    // 도어락 비밀번호 또는 출입 정보
    @Column(length = 100)
    private String doorLockCode;

    // 추가 메모
    @Column(length = 300)
    private String comment;

    // 비식별 단말 식별자
    @Column(length = 100)
    private String userFingerprint;

    @Column(name = "user_id")
    private Long userId;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
    }
}

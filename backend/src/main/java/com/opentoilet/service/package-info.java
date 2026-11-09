/**
 * <h3>Service 패키지</h3>
 * <p>
 * 비즈니스 로직을 처리하는 핵심 계층입니다. 트랜잭션(@Transactional)을 관리하며,
 * Repository를 호출하여 데이터를 조회/저장하고 DTO로 변환하여 Controller에 전달합니다.
 * </p>
 * <ul>
 *   <li>ToiletService: 현재 위치 기반 Haversine 공식 거리 계산 및 필터링 검색</li>
 *   <li>ReportService: 사용자 제보 검증, 신뢰도 및 최신 정보 갱신 처리</li>
 *   <li>IssueService: 오류 신고 접수 및 상태 업데이트</li>
 * </ul>
 */
package com.opentoilet.service;

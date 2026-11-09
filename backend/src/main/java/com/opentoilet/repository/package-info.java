/**
 * <h3>Repository 패키지</h3>
 * <p>
 * Spring Data JPA의 JpaRepository 인터페이스를 상속받아 MySQL 데이터베이스와 직접 CRUD를 수행하는 계층입니다.
 * 인터페이스 선언만으로 기본적인 save(), findById(), findAll() 등이 자동 구현됩니다.
 * </p>
 * <ul>
 *   <li>ToiletRepository: 위도/경도 범위 검색, 조건 필터 검색 쿼리 메소드</li>
 *   <li>ReportRepository: 특정 화장실의 최신 제보 목록 조회</li>
 *   <li>IssueReportRepository: 접수된 오류 신고 관리</li>
 * </ul>
 */
package com.opentoilet.repository;

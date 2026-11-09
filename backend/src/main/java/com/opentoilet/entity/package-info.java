/**
 * <h3>Entity 패키지</h3>
 * <p>
 * 데이터베이스(MySQL)의 테이블과 1:1로 매핑되는 JPA 엔티티 클래스들이 위치합니다.
 * @Entity, @Table, @Id, @Column 등의 어노테이션을 사용하여 테이블 스키마를 정의합니다.
 * </p>
 * <ul>
 *   <li>Toilet: 개방화장실 기본 정보 (이름, 주소, 위경도, 개방시간, 편의시설 등)</li>
 *   <li>ToiletReport: 사용자가 등록한 실시간 제보 (휴지 유무, 위생 상태, 도어락 번호)</li>
 *   <li>IssueReport: 오류 신고 (폐쇄, 위치 오류 등)</li>
 * </ul>
 */
package com.opentoilet.entity;

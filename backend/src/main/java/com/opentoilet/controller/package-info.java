/**
 * <h3>Controller 패키지</h3>
 * <p>
 * 프론트엔드(React Native)로부터의 REST API HTTP 요청(GET, POST, PUT, DELETE)을 받아
 * 파라미터 검증 후 Service 계층을 호출하고 JSON 형태로 응답(ResponseEntity)을 반환하는 계층입니다.
 * </p>
 * <ul>
 *   <li>ToiletController: 화장실 주변 검색, 상세 조회 API</li>
 *   <li>ReportController: 화장실 상태 제보 등록 및 내역 조회 API</li>
 *   <li>IssueController: 정보 오류 신고 API</li>
 * </ul>
 */
package com.opentoilet.controller;

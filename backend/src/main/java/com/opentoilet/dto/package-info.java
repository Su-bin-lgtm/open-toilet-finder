/**
 * <h3>DTO (Data Transfer Object) 패키지</h3>
 * <p>
 * 클라이언트(React Native 앱)와 서버 간의 데이터 전송용 순수 데이터 객체들을 정의합니다.
 * Entity 객체를 직접 외부에 노출하지 않고, DTO를 통해 필요한 데이터만 선별하여 안전하게 통신합니다.
 * </p>
 * <ul>
 *   <li>request: 클라이언트가 서버로 보낼 때 사용하는 요청 DTO (예: ToiletSearchRequest, ReportCreateRequest)</li>
 *   <li>response: 서버가 클라이언트에게 전달하는 응답 DTO (예: ToiletSummaryResponse, ToiletDetailResponse)</li>
 * </ul>
 */
package com.opentoilet.dto;

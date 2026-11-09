/**
 * 개방화장실 데이터 모델 및 API 통신용 TypeScript 인터페이스
 */

// 위생 상태 구분
export type HygieneStatus = 'CLEAN' | 'NORMAL' | 'DIRTY';

// 화장실 요약 정보 (지도 마커 및 리스트 카드용)
export interface ToiletSummary {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  distanceMeter?: number;      // 사용자 현재 위치로부터의 거리(미터)
  isOpenNow: boolean;          // 현재 개방 여부
  openTimeInfo: string;        // 개방 시간 안내 (예: "24시간", "09:00 ~ 18:00")
  hasDisabledToilet: boolean;  // 장애인 화장실 유무
  hasDiaperTable: boolean;     // 기저귀 교환대 유무
  hasTissue: boolean;          // 휴지 비치 여부
  hygieneStatus: HygieneStatus;// 위생 상태
}

// 화장실 상세 정보
export interface ToiletDetail extends ToiletSummary {
  maleWaterClosetCount: number;    // 남성 대변기 수
  maleUrinalCount: number;         // 남성 소변기 수
  femaleWaterClosetCount: number;  // 여성 대변기 수
  doorLockCode?: string;           // 도어락 비밀번호 또는 출입 안내
  emergencyBell: boolean;          // 비상벨 설치 여부
  cctvInstalled: boolean;          // 입구 CCTV 설치 여부
  managementAgency: string;        // 관리 기관명
  phoneNumber?: string;            // 관리처 전화번호
  updatedAt: string;               // 최근 정보 수정일시
}

// 사용자 실시간 상태 제보 요청 데이터
export interface ToiletReportRequest {
  toiletId: number;
  hasTissue: boolean;
  hygieneStatus: HygieneStatus;
  isOpen: boolean;
  doorLockCode?: string;
  comment?: string;
}

// 화장실 정보 오류 신고 요청 데이터
export interface IssueReportRequest {
  toiletId: number;
  issueType: 'CLOSED' | 'WRONG_LOCATION' | 'WRONG_PASSWORD' | 'OTHER';
  content: string;
}

// 검색 필터 옵션
export interface ToiletFilterOptions {
  onlyOpenNow?: boolean;
  hasDisabledToilet?: boolean;
  hasDiaperTable?: boolean;
  hasTissue?: boolean;
  radiusMeter?: number; // 기본 500m ~ 1000m
}

// API 요청·응답 타입 (FE-04) — 3주차 UI 시안을 반영한 초안 v2
//
// ※ 초안입니다. 필드 이름과 값은 docs/api 명세 합의(COM-04) 후 그 명세에 맞춰 고칩니다.
//   시안에서 새로 필요해진 필드(위치 설명, 출입 방법, 사진, 최근 제보 등)는 백엔드 확인이 필요합니다.
//
// 사용하는 API
//   GET  /api/toilets/nearby              주변 화장실 조회 → Toilet[]   (4주차: 필터 조건 전달)
//   GET  /api/toilets/{id}                화장실 상세 조회 → Toilet
//   POST /api/toilets/{id}/reports        제보 등록(4주차)  → ReportResult
//   POST /api/toilets/{id}/error-reports  오류 신고(4주차)  → ErrorReportResult
// 오류가 나면 { code, message } 형식으로 응답합니다. (BE-10)

export interface Coords {
  latitude: number;
  longitude: number;
}

/**
 * 서버가 알려 주는 운영 상태 (시안 기준: 이용 가능 / 점검 중 / 운영 중지).
 * 체크리스트 UI-09(개방 / 폐쇄 / 확인 안 됨)와 이름이 다르므로 확정이 필요합니다.
 */
export type ToiletStatus = 'AVAILABLE' | 'MAINTENANCE' | 'SUSPENDED';

export type PaperStatus = 'PROVIDED' | 'NONE' | 'UNKNOWN';

/** 출입 비밀번호가 필요한지 (비밀번호 값 자체는 4주차 UI-11 안내 문구와 함께 다룬다) */
export type PasscodeStatus = 'NOT_REQUIRED' | 'REQUIRED' | 'UNKNOWN';

/** 가장 최근에 들어온 사용자 제보 한 건 */
export interface RecentReport {
  text: string;
  tag: string; // 예: "정상 이용"
  createdAt: string; // ISO 8601
}

export interface Toilet {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  status: ToiletStatus;
  /** 상태 보충 설명. 예: "시설 점검 · 14:00까지", "금일 운영 중지" */
  statusNote?: string;
  /** 운영시간 원문. 예: "24시간 개방", "매일 06:00 – 22:00", "평일 09:00 – 18:00" */
  openTime: string;
  holidayNote?: string; // 예: "공휴일 정상 운영"
  locationNote?: string; // 예: "서울숲 2번 출입구 옆"
  entryGuide?: string; // 출입 방법
  hasAccessible: boolean; // 장애인 화장실
  hasDiaperTable: boolean; // 기저귀 교환대
  /** 남녀 공용 화장실 (4주차 FE-11 필터용 — 백엔드 필드명 확인 필요) */
  isUnisex: boolean;
  toiletPaper: PaperStatus;
  /** 위생 상태 (최근 제보 기준, 없으면 표시하지 않는다 — 백엔드 확인 필요) */
  hygiene?: HygieneLevel | 'UNKNOWN';
  passcode: PasscodeStatus;
  photoUrls: string[];
  recentReport?: RecentReport;
  /** 마지막 정보 업데이트 시각 (ISO 8601) */
  updatedAt?: string;
  /** 현재 기준 위치로부터의 거리(m). 서버가 주지 않아도 앱이 계산해서 채운다. */
  distanceM?: number;
}

/**
 * 서버로 보내는 조회 조건 (FE-11). 켜진 조건만 쿼리 문자열에 붙는다.
 *   ?lat=&lng=&radius=&accessible=true&diaperTable=true&unisex=true
 */
export interface ServerFilter {
  accessibleOnly: boolean; // 장애인 화장실
  diaperTableOnly: boolean; // 기저귀 교환대
  unisexOnly: boolean; // 남녀 공용
}

/** 주변 화장실 조회 조건 */
export interface NearbyToiletsQuery extends Coords {
  radius?: number; // m
  filter?: ServerFilter;
}

/**
 * 화면에서 쓰는 필터.
 * 서버 조건(ServerFilter)에 더해, 지금 시각에 따라 달라지는 "이용 가능"은 앱이 직접 거른다.
 */
export interface ToiletFilter extends ServerFilter {
  availableOnly: boolean;
}

// ───────── 제보 등록 (FE-12) ─────────
export type HygieneLevel = 'CLEAN' | 'NORMAL' | 'DIRTY';

/** 제보 입력값. 선택 방식 위주이며, 모르는 항목은 UNKNOWN 으로 보낸다. (UI-07) */
export interface ReportRequest {
  /** 개방 여부 */
  status: ToiletStatus;
  /** 도어락(출입 비밀번호) 필요 여부 */
  passcode: PasscodeStatus;
  toiletPaper: PaperStatus;
  hygiene: HygieneLevel | 'UNKNOWN';
  /** 한 줄 메모 (선택, 최대 100자) */
  comment?: string;
}

export interface ReportResult {
  id: string;
  /** 서버가 기록한 제보 시각 (ISO 8601) */
  createdAt: string;
}

// ───────── 오류 신고 (FE-13) ─────────
export type ErrorReportReason =
  | 'WRONG_LOCATION' // 위치가 달라요
  | 'WRONG_HOURS' // 운영시간이 달라요
  | 'CLOSED_OR_REMOVED' // 없어졌거나 폐쇄됐어요
  | 'WRONG_FACILITY' // 편의시설 정보가 달라요
  | 'DOORLOCK_REMOVAL' // 도어락 정보 삭제 요청 (관리 주체, UI-11 / BE-17)
  | 'OTHER';

export interface ErrorReportRequest {
  reason: ErrorReportReason;
  /** 자세한 설명 (선택, 최대 200자) */
  description?: string;
}

export interface ErrorReportResult {
  id: string;
  /** 처리 상태. 예: RECEIVED (BE-15) */
  status: string;
}

/** 오류 응답 본문 (BE-10) */
export interface ApiErrorBody {
  code: string;
  message: string;
}

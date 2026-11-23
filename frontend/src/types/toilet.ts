// API 요청·응답 타입 (FE-04) — 3주차 UI 시안을 반영한 초안 v2
//
// ※ 초안입니다. 필드 이름과 값은 docs/api 명세 합의(COM-04) 후 그 명세에 맞춰 고칩니다.
//   시안에서 새로 필요해진 필드(위치 설명, 출입 방법, 사진, 최근 제보 등)는 백엔드 확인이 필요합니다.
//
// 3주차에 쓰는 API
//   GET /api/toilets/nearby   주변 화장실 조회 → Toilet[]
//   GET /api/toilets/{id}     화장실 상세 조회 → Toilet
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
  toiletPaper: PaperStatus;
  passcode: PasscodeStatus;
  photoUrls: string[];
  recentReport?: RecentReport;
  /** 마지막 정보 업데이트 시각 (ISO 8601) */
  updatedAt?: string;
  /** 현재 기준 위치로부터의 거리(m). 서버가 주지 않아도 앱이 계산해서 채운다. */
  distanceM?: number;
}

/** 주변 화장실 조회 조건. 필터는 4주차(FE-11)에 서버 조회 조건으로 전달한다. */
export interface NearbyToiletsQuery extends Coords {
  radius?: number; // m
}

/** 화면에서 쓰는 필터 (3주차는 앱에서 거른다) */
export interface ToiletFilter {
  accessibleOnly: boolean;
  diaperTableOnly: boolean;
  availableOnly: boolean;
}

/** 오류 응답 본문 (BE-10) */
export interface ApiErrorBody {
  code: string;
  message: string;
}

// 서버(Spring Boot)와 주고받는 데이터의 모양을 한곳에 정의한다.
// 백엔드 DTO가 바뀌면 이 파일만 고치면 된다. (API 명세 합의 후 맞출 것)

export interface Coords {
  latitude: number;
  longitude: number;
}

/** 위생 상태 (이용자 제보 기준) */
export type HygieneLevel = 'GOOD' | 'NORMAL' | 'BAD' | 'UNKNOWN';

/** 휴지 유무 (이용자 제보 기준) */
export type PaperStatus = 'YES' | 'NO' | 'UNKNOWN';

/** 지금 들어갈 수 있는지에 대한 화면용 상태 */
export type OpenStatus = 'OPEN' | 'CLOSED' | 'LOCKED' | 'UNKNOWN';

/** 도어락·출입 방법 */
export interface DoorLockInfo {
  hasLock: boolean;
  method?: string; // 예: "번호 키패드", "열쇠"
  code?: string; // 제보된 비밀번호
  hint?: string; // 예: "1층 안내데스크에서 열쇠를 빌려요"
}

export interface Toilet {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  /** 공공데이터의 개방시간 원문. 예: "24시간", "09:00~18:00", "평일 09:00~18:00" */
  openTime: string;
  doorLock: DoorLockInfo;
  hygiene: HygieneLevel;
  toiletPaper: PaperStatus;
  /** 최근 제보에서 "문이 잠겨 있었다"고 한 경우 true */
  isLocked?: boolean;
  hasAccessible: boolean; // 장애인 화장실
  hasDiaperTable: boolean; // 기저귀 교환대
  isUnisex: boolean; // 남녀 공용
  /** 마지막 제보 시각 (ISO 8601) */
  lastReportedAt?: string;
  managingOrg?: string;
  phone?: string;
  /** 현재 위치로부터의 거리(m). 서버가 주지 않아도 앱이 계산해서 채운다. */
  distanceM?: number;
}

export interface ToiletFilter {
  openNowOnly: boolean;
  accessibleOnly: boolean;
  diaperTableOnly: boolean;
  unisexOnly: boolean;
}

/** 위생·휴지·문 상태 제보 */
export interface ReportPayload {
  hygiene: Exclude<HygieneLevel, 'UNKNOWN'>;
  toiletPaper: Exclude<PaperStatus, 'UNKNOWN'>;
  isLocked: boolean;
  doorLockCode?: string;
  memo?: string;
}

export type ErrorReason =
  | 'WRONG_LOCATION'
  | 'CLOSED_PERMANENTLY'
  | 'WRONG_INFO'
  | 'NOT_TOILET'
  | 'OTHER';

/** 잘못된 정보 오류 신고 */
export interface ErrorReportPayload {
  reason: ErrorReason;
  detail?: string;
}

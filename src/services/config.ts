// 환경변수는 EXPO_PUBLIC_ 접두사가 붙은 것만 앱에서 읽을 수 있다.
// 값은 frontend/.env 에 적는다. (.env 는 .gitignore 로 커밋되지 않는다 → .env.example 참고)

const rawBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? '';

/** 서버 주소. 끝의 슬래시는 제거한다. 예: http://192.168.0.10:8080 */
export const API_BASE_URL = rawBaseUrl.trim().replace(/\/+$/, '');

/** 서버 주소가 비어 있거나 EXPO_PUBLIC_USE_MOCK=true 이면 샘플 데이터로 동작한다. */
export const USE_MOCK =
  process.env.EXPO_PUBLIC_USE_MOCK === 'true' || API_BASE_URL === '';

export const REQUEST_TIMEOUT_MS = 10_000;

/** 주변 검색 반경(m) */
export const DEFAULT_RADIUS_M = 1000;

/** 위치 권한이 없을 때 쓰는 기본 위치 (서울시청) */
export const FALLBACK_CENTER = { latitude: 37.5665, longitude: 126.978 };

/** 네이버지도 URL Scheme 의 appname (앱 식별자와 맞춘다) */
export const MAP_APP_NAME = 'com.opentoilet.app';

/** "잠겨 있음" 제보를 유효하다고 볼 시간 (3시간) */
export const RECENT_LOCK_REPORT_MS = 3 * 60 * 60 * 1000;

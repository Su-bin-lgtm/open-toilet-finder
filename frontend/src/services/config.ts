// 서버 주소 같은 환경변수를 읽는 곳 (FE-03)
// - 값은 frontend/.env 에 적는다. (.env 는 커밋하지 않는다 → .env.example 참고)
// - Expo 는 EXPO_PUBLIC_ 으로 시작하는 환경변수만 앱 코드에서 읽을 수 있다.
import type { Coords } from '../types/toilet';

const rawBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? '';

/** 백엔드 서버 주소. 끝의 슬래시는 제거한다. 예: http://localhost:8080 */
export const API_BASE_URL = rawBaseUrl.trim().replace(/\/+$/, '');

/** 서버 주소가 비어 있으면 샘플 데이터(mock)로 동작한다. */
export const USE_MOCK = API_BASE_URL === '';

export const REQUEST_TIMEOUT_MS = 10_000;

/** 주변 검색 반경(m) */
export const DEFAULT_RADIUS_M = 1000;

/** 위치를 쓸 수 없을 때의 기본 위치 (서울시청) */
export const FALLBACK_CENTER: Coords = { latitude: 37.5665, longitude: 126.978 };

/** 도보 시간 계산에 쓰는 걷는 속도 (m/분) */
export const WALK_METERS_PER_MIN = 80;

// 화면과 상관없는 "계산" 규칙: 거리, 운영 상태, 정렬, 필터, 검색, 날짜 표시.
import { WALK_METERS_PER_MIN } from './config';
import type { Coords, Toilet, ToiletFilter } from '../types/toilet';

// ───────── 거리 ─────────
const EARTH_RADIUS_M = 6_371_000;
const toRad = (deg: number) => (deg * Math.PI) / 180;

/** 두 좌표 사이의 거리(m). 하버사인(Haversine) 공식. */
export function distanceMeters(a: Coords, b: Coords): number {
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function formatDistance(meters?: number): string {
  if (meters === undefined) return '';
  if (meters < 1000) return `${Math.max(10, Math.round(meters / 10) * 10)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}

/** 도보 시간(분). 최소 1분. */
export function walkMinutes(meters?: number): number {
  if (meters === undefined) return 0;
  return Math.max(1, Math.round(meters / WALK_METERS_PER_MIN));
}

/** 기준 위치로부터의 거리를 계산해 채운다. */
export function withDistance(list: Toilet[], from: Coords): Toilet[] {
  return list.map((t) => ({ ...t, distanceM: distanceMeters(from, t) }));
}

// ───────── 운영시간 해석 ─────────
const ALWAYS_OPEN = /(24\s*시간|상시|00:00\s*[~\-–]\s*24:00)/;
const TIME_RANGE = /(\d{1,2}):(\d{2})\s*[~\-–]\s*(\d{1,2}):(\d{2})/g;

/**
 * 운영시간 문자열만 보고 지금 열려 있는지 판단한다.
 * 해석할 수 없는 형식(시간대가 여러 개 등)은 틀린 정보를 주지 않도록 UNKNOWN 으로 둔다.
 */
export function getScheduleStatus(
  openTime: string,
  now: Date,
): 'OPEN' | 'CLOSED' | 'UNKNOWN' {
  const text = openTime.trim();
  if (!text) return 'UNKNOWN';
  if (ALWAYS_OPEN.test(text)) return 'OPEN';

  const ranges = [...text.matchAll(TIME_RANGE)];
  if (ranges.length !== 1) return 'UNKNOWN';

  const day = now.getDay(); // 0=일 … 6=토
  const isWeekend = day === 0 || day === 6;
  if (text.includes('평일') && !text.includes('주말') && isWeekend) return 'CLOSED';
  if (text.includes('주말') && !text.includes('평일') && !isWeekend) return 'CLOSED';

  const [, sh, sm, eh, em] = ranges[0];
  const start = Number(sh) * 60 + Number(sm);
  const end = Number(eh) * 60 + Number(em);
  if (start === end) return 'UNKNOWN';

  const current = now.getHours() * 60 + now.getMinutes();
  const isOpen =
    start < end
      ? current >= start && current < end
      : current >= start || current < end; // 22:00~06:00 처럼 자정을 넘기는 경우
  return isOpen ? 'OPEN' : 'CLOSED';
}

/** "오늘 22:00까지" / "24시간 개방". 지금 열려 있지 않거나 해석할 수 없으면 null. */
export function getClosingLabel(openTime: string, now: Date): string | null {
  if (getScheduleStatus(openTime, now) !== 'OPEN') return null;
  if (ALWAYS_OPEN.test(openTime)) return '24시간 개방';
  const ranges = [...openTime.matchAll(TIME_RANGE)];
  if (ranges.length !== 1) return null;
  const [, , , eh, em] = ranges[0];
  const hour = Number(eh) === 24 ? '24' : eh.padStart(2, '0');
  return `오늘 ${hour}:${em}까지`;
}

// ───────── 화면에 보여 줄 상태 ─────────
/**
 * 서버의 운영 상태(status)와 운영시간을 합친 표시용 상태.
 * - CLOSED_NOW(운영 종료), UNKNOWN(시간 확인 필요)은 시안에 없는 값이라 UI 담당과 확인이 필요하다.
 */
export type DisplayStatus = 'AVAILABLE' | 'MAINTENANCE' | 'SUSPENDED' | 'CLOSED_NOW' | 'UNKNOWN';

export function getDisplayStatus(toilet: Toilet, now: Date = new Date()): DisplayStatus {
  if (toilet.status === 'SUSPENDED') return 'SUSPENDED';
  if (toilet.status === 'MAINTENANCE') return 'MAINTENANCE';
  const schedule = getScheduleStatus(toilet.openTime, now);
  if (schedule === 'OPEN') return 'AVAILABLE';
  if (schedule === 'CLOSED') return 'CLOSED_NOW';
  return 'UNKNOWN';
}

export const STATUS_LABEL: Record<DisplayStatus, string> = {
  AVAILABLE: '이용 가능',
  MAINTENANCE: '점검 중',
  SUSPENDED: '운영 중지',
  CLOSED_NOW: '운영 종료',
  UNKNOWN: '시간 확인 필요',
};

/** 목록 정렬 우선순위: 이용 가능한 곳이 먼저 (시안의 "가까운 순 · 이용 가능 우선") */
const STATUS_ORDER: Record<DisplayStatus, number> = {
  AVAILABLE: 0,
  UNKNOWN: 1,
  MAINTENANCE: 2,
  CLOSED_NOW: 3,
  SUSPENDED: 4,
};

export function sortToilets(list: Toilet[], now: Date = new Date()): Toilet[] {
  return [...list].sort((a, b) => {
    const byStatus = STATUS_ORDER[getDisplayStatus(a, now)] - STATUS_ORDER[getDisplayStatus(b, now)];
    if (byStatus !== 0) return byStatus;
    return (a.distanceM ?? 0) - (b.distanceM ?? 0);
  });
}

// ───────── 필터와 검색 ─────────
export const DEFAULT_FILTER: ToiletFilter = {
  accessibleOnly: false,
  diaperTableOnly: false,
  availableOnly: false,
};

export function applyFilter(
  list: Toilet[],
  filter: ToiletFilter,
  now: Date = new Date(),
): Toilet[] {
  return list.filter((t) => {
    if (filter.accessibleOnly && !t.hasAccessible) return false;
    if (filter.diaperTableOnly && !t.hasDiaperTable) return false;
    if (filter.availableOnly && getDisplayStatus(t, now) !== 'AVAILABLE') return false;
    return true;
  });
}

/** 이름 또는 주소에 검색어가 들어 있는지 (대소문자·앞뒤 공백 무시) */
export function matchesQuery(toilet: Toilet, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return toilet.name.toLowerCase().includes(q) || toilet.address.toLowerCase().includes(q);
}

// ───────── 날짜 표시 ─────────
/** "2026.11.16 10:24" 형식 */
export function formatDateTime(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

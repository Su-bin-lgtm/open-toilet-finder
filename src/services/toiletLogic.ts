// 화면과 상관없는 "계산" 규칙을 모아 둔 파일: 거리, 개방 여부, 필터, 시간 표시.
import { RECENT_LOCK_REPORT_MS } from './config';
import type {
  Coords,
  HygieneLevel,
  OpenStatus,
  PaperStatus,
  Toilet,
  ToiletFilter,
} from '../types/toilet';

// ───────── 거리 ─────────
const EARTH_RADIUS_M = 6_371_000;
const toRad = (deg: number) => (deg * Math.PI) / 180;

/** 두 좌표 사이의 거리(m). 하버사인(Haversine) 공식. */
export function distanceMeters(a: Coords, b: Coords): number {
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) *
      Math.cos(toRad(b.latitude)) *
      Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function formatDistance(meters?: number): string {
  if (meters === undefined) return '';
  if (meters < 1000) return `${Math.max(10, Math.round(meters / 10) * 10)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}

/** 거리를 계산해 채우고 가까운 순으로 정렬한다. */
export function withDistance(list: Toilet[], from: Coords): Toilet[] {
  return list
    .map((t) => ({ ...t, distanceM: distanceMeters(from, t) }))
    .sort((a, b) => (a.distanceM ?? 0) - (b.distanceM ?? 0));
}

// ───────── 개방 여부 ─────────
const ALWAYS_OPEN = /(24\s*시간|상시|00:00\s*[~\-–]\s*24:00)/;
const TIME_RANGE = /(\d{1,2}):(\d{2})\s*[~\-–]\s*(\d{1,2}):(\d{2})/g;

/**
 * 개방시간 문자열만 보고 지금 열려 있는지 판단한다.
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

/** 개방시간 + 최근 "잠겨 있음" 제보를 합친 최종 상태 */
export function getAccessStatus(toilet: Toilet, now: Date = new Date()): OpenStatus {
  if (toilet.isLocked && toilet.lastReportedAt) {
    const age = now.getTime() - new Date(toilet.lastReportedAt).getTime();
    if (age >= 0 && age <= RECENT_LOCK_REPORT_MS) return 'LOCKED';
  }
  return getScheduleStatus(toilet.openTime, now);
}

// ───────── 필터 ─────────
export const DEFAULT_FILTER: ToiletFilter = {
  openNowOnly: false,
  accessibleOnly: false,
  diaperTableOnly: false,
  unisexOnly: false,
};

export function applyFilter(
  list: Toilet[],
  filter: ToiletFilter,
  now: Date = new Date(),
): Toilet[] {
  return list.filter((t) => {
    if (filter.accessibleOnly && !t.hasAccessible) return false;
    if (filter.diaperTableOnly && !t.hasDiaperTable) return false;
    if (filter.unisexOnly && !t.isUnisex) return false;
    if (filter.openNowOnly) {
      const status = getAccessStatus(t, now);
      // 시간 정보를 알 수 없는 곳(UNKNOWN)은 지우지 않고 남겨 둔다.
      if (status === 'CLOSED' || status === 'LOCKED') return false;
    }
    return true;
  });
}

// ───────── 표시용 문구 ─────────
export const OPEN_STATUS_LABEL: Record<OpenStatus, string> = {
  OPEN: '개방 중',
  CLOSED: '닫힘',
  LOCKED: '잠김 제보',
  UNKNOWN: '시간 정보 없음',
};

export const HYGIENE_LABEL: Record<HygieneLevel, string> = {
  GOOD: '깨끗해요',
  NORMAL: '보통이에요',
  BAD: '더러워요',
  UNKNOWN: '위생 정보 없음',
};

export const PAPER_LABEL: Record<PaperStatus, string> = {
  YES: '휴지 있음',
  NO: '휴지 없음',
  UNKNOWN: '휴지 정보 없음',
};

export function formatRelativeTime(iso?: string, now: Date = new Date()): string {
  if (!iso) return '제보 없음';
  const diff = now.getTime() - new Date(iso).getTime();
  if (Number.isNaN(diff)) return '제보 없음';
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  return days < 30 ? `${days}일 전` : '30일 이상 전';
}

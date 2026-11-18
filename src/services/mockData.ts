// 백엔드가 아직 없을 때 쓰는 "가짜 서버". 실제 장소가 아니라 샘플이다.
// 현재 위치를 기준으로 주변에 샘플 화장실을 만들어, 어디서 실행해도 지도에 보이게 한다.
// 제보를 보내면 메모리 안의 데이터가 바뀌므로 "제보 → 최신 정보 반영" 흐름을 시연할 수 있다.
import { distanceMeters } from './toiletLogic';
import type {
  Coords,
  ErrorReportPayload,
  ReportPayload,
  Toilet,
} from '../types/toilet';

const METERS_PER_DEG_LAT = 111_320;
const LATENCY_MS = 400;
const RESEED_DISTANCE_M = 5_000;

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();

function offset(center: Coords, northM: number, eastM: number): Coords {
  return {
    latitude: center.latitude + northM / METERS_PER_DEG_LAT,
    longitude:
      center.longitude +
      eastM / (METERS_PER_DEG_LAT * Math.cos((center.latitude * Math.PI) / 180)),
  };
}

let anchor: Coords | null = null;
let store: Toilet[] = [];

function seed(center: Coords): Toilet[] {
  const make = (
    n: number,
    north: number,
    east: number,
    rest: Omit<Toilet, 'id' | 'latitude' | 'longitude' | 'address'>,
  ): Toilet => ({
    id: `mock-${n}`,
    address: `샘플 주소 ${n} (실제 위치 아님)`,
    ...offset(center, north, east),
    ...rest,
  });

  return [
    make(1, 120, 60, {
      name: '샘플 공원 화장실',
      isUnisex: false,
      openTime: '24시간',
      doorLock: { hasLock: false },
      hygiene: 'GOOD',
      toiletPaper: 'YES',
      hasAccessible: true,
      hasDiaperTable: true,
      lastReportedAt: minutesAgo(3),
      managingOrg: '샘플 시설관리공단',
      phone: '02-000-0001',
    }),
    make(2, -200, 150, {
      name: '샘플 주민센터 화장실',
      isUnisex: false,
      openTime: '평일 09:00~18:00',
      doorLock: { hasLock: true, method: '열쇠', hint: '1층 민원실에서 열쇠를 빌려요' },
      hygiene: 'NORMAL',
      toiletPaper: 'YES',
      hasAccessible: true,
      hasDiaperTable: false,
      lastReportedAt: minutesAgo(95),
      managingOrg: '샘플 주민센터',
    }),
    make(3, 320, -240, {
      name: '샘플 지하철역 화장실',
      isUnisex: false,
      openTime: '05:30~24:00',
      doorLock: { hasLock: false },
      hygiene: 'GOOD',
      toiletPaper: 'NO',
      hasAccessible: true,
      hasDiaperTable: true,
      lastReportedAt: minutesAgo(40),
    }),
    make(4, -350, -180, {
      name: '샘플 도서관 화장실',
      isUnisex: false,
      openTime: '09:00~21:00',
      doorLock: { hasLock: false },
      hygiene: 'GOOD',
      toiletPaper: 'YES',
      hasAccessible: true,
      hasDiaperTable: true,
      lastReportedAt: minutesAgo(600),
      phone: '02-000-0004',
    }),
    make(5, 450, 380, {
      name: '샘플 상가 화장실',
      isUnisex: true,
      openTime: '10:00~22:00',
      doorLock: { hasLock: true, method: '번호 키패드', code: '1234', hint: '샘플 번호입니다' },
      hygiene: 'BAD',
      toiletPaper: 'NO',
      hasAccessible: false,
      hasDiaperTable: false,
      lastReportedAt: minutesAgo(1500),
    }),
    make(6, -520, 300, {
      name: '샘플 버스터미널 화장실',
      isUnisex: false,
      openTime: '24시간',
      doorLock: { hasLock: false },
      hygiene: 'NORMAL',
      toiletPaper: 'YES',
      hasAccessible: true,
      hasDiaperTable: true,
      lastReportedAt: minutesAgo(15),
    }),
    make(7, 650, -120, {
      name: '샘플 간이 화장실',
      isUnisex: true,
      openTime: '06:00~20:00',
      doorLock: { hasLock: false },
      hygiene: 'UNKNOWN',
      toiletPaper: 'UNKNOWN',
      hasAccessible: false,
      hasDiaperTable: false,
    }),
    make(8, -700, -400, {
      name: '샘플 학교 개방 화장실',
      isUnisex: false,
      openTime: '08:00~17:00',
      doorLock: { hasLock: true, method: '열쇠', hint: '경비실에서 열쇠를 빌려요' },
      hygiene: 'NORMAL',
      toiletPaper: 'YES',
      isLocked: true,
      hasAccessible: false,
      hasDiaperTable: false,
      lastReportedAt: minutesAgo(20),
    }),
  ];
}

function ensureSeed(center: Coords) {
  if (!anchor || distanceMeters(anchor, center) > RESEED_DISTANCE_M) {
    anchor = center;
    store = seed(center);
  }
}

const clone = (t: Toilet): Toilet => ({ ...t, doorLock: { ...t.doorLock } });

export async function mockFetchNearby(center: Coords, radiusM: number): Promise<Toilet[]> {
  await delay(LATENCY_MS);
  ensureSeed(center);
  return store.filter((t) => distanceMeters(center, t) <= radiusM).map(clone);
}

export async function mockFetchDetail(id: string): Promise<Toilet> {
  await delay(LATENCY_MS / 2);
  const found = store.find((t) => t.id === id);
  if (!found) throw new Error('화장실 정보를 찾을 수 없어요.');
  return clone(found);
}

export async function mockSubmitReport(id: string, payload: ReportPayload): Promise<Toilet> {
  await delay(LATENCY_MS);
  const found = store.find((t) => t.id === id);
  if (!found) throw new Error('화장실 정보를 찾을 수 없어요.');
  found.hygiene = payload.hygiene;
  found.toiletPaper = payload.toiletPaper;
  found.isLocked = payload.isLocked;
  found.lastReportedAt = new Date().toISOString();
  if (payload.doorLockCode) {
    found.doorLock = { ...found.doorLock, hasLock: true, code: payload.doorLockCode };
  }
  return clone(found);
}

export async function mockSubmitErrorReport(
  id: string,
  _payload: ErrorReportPayload,
): Promise<void> {
  await delay(LATENCY_MS);
  if (!store.some((t) => t.id === id)) throw new Error('화장실 정보를 찾을 수 없어요.');
}

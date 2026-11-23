// 백엔드가 아직 없을 때 쓰는 "가짜 서버". 실제 장소가 아니라 샘플이다.
// 기준 위치 주변에 샘플 화장실을 만들어, 어디서 실행해도 지도에 보이게 한다.
import { distanceMeters } from './toiletLogic';
import type { Coords, Toilet } from '../types/toilet';

const METERS_PER_DEG_LAT = 111_320;
const LATENCY_MS = 350;
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
    rest: Omit<Toilet, 'id' | 'latitude' | 'longitude' | 'address' | 'photoUrls'>,
  ): Toilet => ({
    id: `mock-${n}`,
    address: `샘플 주소 ${n} (실제 위치 아님)`,
    photoUrls: [],
    ...offset(center, north, east),
    ...rest,
  });

  return [
    make(1, 110, 70, {
      name: '샘플 공원 입구 화장실',
      status: 'AVAILABLE',
      openTime: '24시간 개방',
      holidayNote: '공휴일 정상 운영',
      locationNote: '공원 입구 옆',
      entryGuide: '입구에서 직진 30m · 공원 안쪽 단층 건물 · 별도 인증 없음',
      hasAccessible: true,
      hasDiaperTable: true,
      toiletPaper: 'PROVIDED',
      passcode: 'NOT_REQUIRED',
      recentReport: { text: '깨끗하고 화장지도 충분해요.', tag: '정상 이용', createdAt: minutesAgo(40) },
      updatedAt: minutesAgo(35),
    }),
    make(2, -230, 160, {
      name: '샘플 산책로 화장실',
      status: 'AVAILABLE',
      openTime: '매일 06:00 – 22:00',
      holidayNote: '공휴일 정상 운영',
      locationNote: '산책로 중간 쉼터 옆',
      entryGuide: '산책로 따라 도보 이동 · 별도 인증 없음',
      hasAccessible: true,
      hasDiaperTable: false,
      toiletPaper: 'PROVIDED',
      passcode: 'NOT_REQUIRED',
      updatedAt: minutesAgo(300),
    }),
    make(3, 340, -250, {
      name: '샘플 복지회관 화장실',
      status: 'MAINTENANCE',
      statusNote: '시설 점검 · 14:00까지',
      openTime: '평일 09:00 – 18:00',
      locationNote: '1층 로비 오른쪽',
      entryGuide: '1층 안내데스크 확인 후 이용',
      hasAccessible: true,
      hasDiaperTable: true,
      toiletPaper: 'UNKNOWN',
      passcode: 'UNKNOWN',
      recentReport: { text: '점검 중이라 이용할 수 없었어요.', tag: '이용 불가', createdAt: minutesAgo(120) },
      updatedAt: minutesAgo(115),
    }),
    make(4, -420, -190, {
      name: '샘플 생태숲 화장실',
      status: 'SUSPENDED',
      statusNote: '금일 운영 중지',
      openTime: '매일 06:00 – 18:00',
      locationNote: '숲 안쪽 탐방로 입구',
      hasAccessible: false,
      hasDiaperTable: false,
      toiletPaper: 'UNKNOWN',
      passcode: 'UNKNOWN',
      updatedAt: minutesAgo(900),
    }),
    make(5, 560, 330, {
      name: '샘플 역사 화장실',
      status: 'AVAILABLE',
      openTime: '05:30 – 24:00',
      locationNote: '개찰구 밖 3번 출구 방향',
      entryGuide: '개찰구 밖에 있어 승차권 없이 이용 가능',
      hasAccessible: true,
      hasDiaperTable: true,
      toiletPaper: 'PROVIDED',
      passcode: 'REQUIRED',
      updatedAt: minutesAgo(1500),
    }),
    make(6, -640, 410, {
      name: '샘플 도서관 화장실',
      status: 'AVAILABLE',
      openTime: '09:00 – 21:00',
      holidayNote: '공휴일 휴관',
      locationNote: '2층 열람실 입구 맞은편',
      entryGuide: '건물 안 계단 또는 엘리베이터로 2층',
      hasAccessible: true,
      hasDiaperTable: false,
      toiletPaper: 'NONE',
      passcode: 'NOT_REQUIRED',
      recentReport: { text: '화장지가 떨어졌어요.', tag: '휴지 부족', createdAt: minutesAgo(600) },
      updatedAt: minutesAgo(600),
    }),
  ];
}

function ensureSeed(center: Coords) {
  if (!anchor || distanceMeters(anchor, center) > RESEED_DISTANCE_M) {
    anchor = center;
    store = seed(center);
  }
}

const clone = (t: Toilet): Toilet => ({ ...t, photoUrls: [...t.photoUrls] });

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

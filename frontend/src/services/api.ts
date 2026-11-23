// 서버 호출은 전부 이 파일을 거친다. 화면은 fetch 를 직접 쓰지 않는다. (FE-05)
//
// ※ 주소와 응답 모양은 초안이다. 백엔드와 API 명세를 맞춘 뒤(COM-04) 고친다.
//   GET /api/toilets/nearby?lat=&lng=&radius=   → Toilet[]
//   GET /api/toilets/{id}                       → Toilet
// 제보 등록·오류 신고 함수는 해당 API 가 나오는 4주차에 추가한다.
import { API_BASE_URL, DEFAULT_RADIUS_M, REQUEST_TIMEOUT_MS, USE_MOCK } from './config';
import { mockFetchDetail, mockFetchNearby } from './mockData';
import type { NearbyToiletsQuery, Toilet } from '../types/toilet';

export class ApiError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function readErrorMessage(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { message?: unknown };
    if (typeof body.message === 'string' && body.message) return body.message;
  } catch {
    // 본문이 JSON 이 아니면 아래 기본 문구를 쓴다.
  }
  return `요청에 실패했어요. (${res.status})`;
}

async function get<T>(path: string): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!res.ok) throw new ApiError(res.status, await readErrorMessage(res));
    return (await res.json()) as T;
  } catch (e) {
    if (e instanceof ApiError) throw e;
    if (e instanceof Error && e.name === 'AbortError') {
      throw new Error('서버 응답이 너무 늦어요. 잠시 후 다시 시도해 주세요.');
    }
    // 웹에서는 서버의 CORS 설정(BE-11)이 빠져도 이 오류가 난다.
    throw new Error('서버에 연결할 수 없어요. 서버 주소와 CORS 설정을 확인해 주세요.');
  } finally {
    clearTimeout(timer);
  }
}

export function fetchNearbyToilets(query: NearbyToiletsQuery): Promise<Toilet[]> {
  const radius = query.radius ?? DEFAULT_RADIUS_M;
  if (USE_MOCK) return mockFetchNearby(query, radius);
  const qs = `lat=${query.latitude}&lng=${query.longitude}&radius=${radius}`;
  return get<Toilet[]>(`/api/toilets/nearby?${qs}`);
}

export function fetchToiletDetail(id: string): Promise<Toilet> {
  if (USE_MOCK) return mockFetchDetail(id);
  return get<Toilet>(`/api/toilets/${encodeURIComponent(id)}`);
}

// 서버 호출은 전부 이 파일을 거친다. 화면은 fetch 를 직접 쓰지 않는다.
//
// ※ 아래 주소와 응답 모양은 "프론트가 제안하는 초안"이다. 백엔드와 API 명세를 맞춘 뒤 고칠 것.
//   GET  /api/toilets/nearby?lat=&lng=&radius=   → Toilet[]
//   GET  /api/toilets/{id}                       → Toilet
//   POST /api/toilets/{id}/reports               → Toilet (제보 반영 후 최신 상태)
//   POST /api/toilets/{id}/error-reports         → 본문 없음(204) 또는 {}
import {
  API_BASE_URL,
  DEFAULT_RADIUS_M,
  REQUEST_TIMEOUT_MS,
  USE_MOCK,
} from './config';
import {
  mockFetchDetail,
  mockFetchNearby,
  mockSubmitErrorReport,
  mockSubmitReport,
} from './mockData';
import type {
  Coords,
  ErrorReportPayload,
  ReportPayload,
  Toilet,
} from '../types/toilet';

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

async function request<T>(
  path: string,
  method: 'GET' | 'POST' = 'GET',
  body?: unknown,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) throw new ApiError(res.status, await readErrorMessage(res));
    if (res.status === 204) return undefined as T;
    const text = await res.text();
    return (text ? JSON.parse(text) : undefined) as T;
  } catch (e) {
    if (e instanceof ApiError) throw e;
    if (e instanceof Error && e.name === 'AbortError') {
      throw new Error('서버 응답이 너무 늦어요. 잠시 후 다시 시도해 주세요.');
    }
    throw new Error('서버에 연결할 수 없어요. 네트워크와 서버 주소를 확인해 주세요.');
  } finally {
    clearTimeout(timer);
  }
}

export function fetchNearbyToilets(
  center: Coords,
  radiusM: number = DEFAULT_RADIUS_M,
): Promise<Toilet[]> {
  if (USE_MOCK) return mockFetchNearby(center, radiusM);
  const query = `lat=${center.latitude}&lng=${center.longitude}&radius=${radiusM}`;
  return request<Toilet[]>(`/api/toilets/nearby?${query}`);
}

export function fetchToiletDetail(id: string): Promise<Toilet> {
  if (USE_MOCK) return mockFetchDetail(id);
  return request<Toilet>(`/api/toilets/${encodeURIComponent(id)}`);
}

export function submitReport(id: string, payload: ReportPayload): Promise<Toilet> {
  if (USE_MOCK) return mockSubmitReport(id, payload);
  return request<Toilet>(`/api/toilets/${encodeURIComponent(id)}/reports`, 'POST', payload);
}

export async function submitErrorReport(
  id: string,
  payload: ErrorReportPayload,
): Promise<void> {
  if (USE_MOCK) return mockSubmitErrorReport(id, payload);
  await request<void>(`/api/toilets/${encodeURIComponent(id)}/error-reports`, 'POST', payload);
}

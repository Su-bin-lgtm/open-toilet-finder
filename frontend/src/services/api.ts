// 서버 호출은 전부 이 파일을 거친다. 화면은 fetch 를 직접 쓰지 않는다. (FE-05)
//
// ※ 주소와 응답 모양은 초안이다. 백엔드와 API 명세를 맞춘 뒤(COM-04) 고친다.
//   GET  /api/toilets/nearby?lat=&lng=&radius=[&accessible=true&diaperTable=true&unisex=true]  → Toilet[]
//   GET  /api/toilets/{id}                       → Toilet
//   POST /api/toilets/{id}/reports               → ReportResult       (제보 등록)
//   POST /api/toilets/{id}/error-reports         → ErrorReportResult  (오류 신고)
import { API_BASE_URL, DEFAULT_RADIUS_M, REQUEST_TIMEOUT_MS, USE_MOCK } from './config';
import {
  mockFetchDetail,
  mockFetchNearby,
  mockPostErrorReport,
  mockPostReport,
} from './mockData';
import type {
  ErrorReportRequest,
  ErrorReportResult,
  NearbyToiletsQuery,
  ReportRequest,
  ReportResult,
  ServerFilter,
  Toilet,
} from '../types/toilet';

export class ApiError extends Error {
  readonly status: number;
  /** 서버 오류 응답의 code (BE-10). 없으면 undefined */
  readonly code?: string;
  constructor(status: number, message: string, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

async function readError(res: Response): Promise<{ message: string; code?: string }> {
  try {
    const body = (await res.json()) as { message?: unknown; code?: unknown };
    const code = typeof body.code === 'string' ? body.code : undefined;
    if (typeof body.message === 'string' && body.message) return { message: body.message, code };
  } catch {
    // 본문이 JSON 이 아니면 아래 기본 문구를 쓴다.
  }
  if (res.status === 429) {
    return { message: '요청이 너무 많아요. 잠시 후 다시 시도해 주세요.' };
  }
  return { message: `요청에 실패했어요. (${res.status})` };
}

async function request<T>(method: 'GET' | 'POST', path: string, body?: unknown): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    const res = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) {
      const { message, code } = await readError(res);
      throw new ApiError(res.status, message, code);
    }
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

/** 켜진 필터 조건만 쿼리 문자열 조각으로 만든다. (FE-11) 예: "&accessible=true&unisex=true" */
export function buildFilterQuery(filter?: ServerFilter): string {
  if (!filter) return '';
  let qs = '';
  if (filter.accessibleOnly) qs += '&accessible=true';
  if (filter.diaperTableOnly) qs += '&diaperTable=true';
  if (filter.unisexOnly) qs += '&unisex=true';
  return qs;
}

export function fetchNearbyToilets(query: NearbyToiletsQuery): Promise<Toilet[]> {
  const radius = query.radius ?? DEFAULT_RADIUS_M;
  if (USE_MOCK) return mockFetchNearby(query, radius, query.filter);
  const qs = `lat=${query.latitude}&lng=${query.longitude}&radius=${radius}${buildFilterQuery(query.filter)}`;
  return request<Toilet[]>('GET', `/api/toilets/nearby?${qs}`);
}

export function fetchToiletDetail(id: string): Promise<Toilet> {
  if (USE_MOCK) return mockFetchDetail(id);
  return request<Toilet>('GET', `/api/toilets/${encodeURIComponent(id)}`);
}

/** 제보 등록 (FE-12) */
export function postReport(toiletId: string, body: ReportRequest): Promise<ReportResult> {
  if (USE_MOCK) return mockPostReport(toiletId, body);
  return request<ReportResult>('POST', `/api/toilets/${encodeURIComponent(toiletId)}/reports`, body);
}

/** 오류 신고 (FE-13) */
export function postErrorReport(
  toiletId: string,
  body: ErrorReportRequest,
): Promise<ErrorReportResult> {
  if (USE_MOCK) return mockPostErrorReport(toiletId, body);
  return request<ErrorReportResult>(
    'POST',
    `/api/toilets/${encodeURIComponent(toiletId)}/error-reports`,
    body,
  );
}

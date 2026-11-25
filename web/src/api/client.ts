import type { ApiResponse } from '../types/toilet'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1').replace(/\/$/, '')
let accessToken: string | null = null

export function setAccessToken(token: string | null) { accessToken = token }

function isApiResponse<T>(value: unknown): value is ApiResponse<T> {
  if (typeof value !== 'object' || value === null) return false

  const candidate = value as Record<string, unknown>
  return typeof candidate.success === 'boolean'
    && typeof candidate.message === 'string'
    && 'data' in candidate
}

export async function requestData<T>(path: string, init?: RequestInit): Promise<T> {
  const isToiletSearch = /^\/toilets\/(search|nearby)(?:\?|$)/.test(path)
  const diagnosticPath = path.split('?')[0]
  if (import.meta.env.DEV && isToiletSearch) {
    const query = new URLSearchParams(path.split('?')[1] ?? '')
    console.info('[OpenToilet] 검색 API 요청', {
      method: init?.method ?? 'GET',
      url: `${API_BASE_URL}${diagnosticPath}`,
      queryKeys: [...query.keys()],
    })
  }
  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: { Accept: 'application/json', ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}), ...init?.headers },
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    if (import.meta.env.DEV && isToiletSearch) {
      console.info('[OpenToilet] 검색 API 연결 실패', { path: diagnosticPath, errorType: error instanceof Error ? error.name : 'unknown' })
    }
    throw new Error('백엔드에 연결하지 못했습니다. 서버 주소와 실행 상태를 확인해 주세요.')
  }

  if (import.meta.env.DEV && isToiletSearch) {
    console.info('[OpenToilet] 검색 API HTTP 응답', { path: diagnosticPath, status: response.status })
  }

  let payload: unknown = null
  try {
    payload = await response.json()
  } catch {
    // Keep the HTTP status as the useful error when the server returns a non-JSON response.
  }

  if (!response.ok) {
    if (response.status >= 500) {
      throw new Error('서버에서 요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.')
    }
    const message = isApiResponse<T>(payload) ? payload.message : null
    throw new Error(message || `요청을 처리하지 못했습니다. (HTTP ${response.status})`)
  }
  if (!isApiResponse<T>(payload)) {
    throw new Error('서버 응답 형식이 올바르지 않습니다.')
  }
  if (!payload.success) throw new Error(payload.message || '요청을 처리하지 못했습니다.')
  if (payload.data === null) {
    if (init?.method === 'PATCH') return payload.data as T
    throw new Error('요청한 정보를 찾을 수 없습니다.')
  }

  return payload.data
}

export async function requestImage(path: string, init?: RequestInit): Promise<Blob> {
  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: { ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}), ...init?.headers },
    })
  } catch {
    throw new Error('이미지 서버에 연결하지 못했습니다.')
  }
  if (!response.ok) {
    let message = `이미지를 불러오지 못했습니다. (HTTP ${response.status})`
    try {
      const payload: unknown = await response.json()
      if (isApiResponse<unknown>(payload) && payload.message) message = payload.message
    } catch { /* The response may be a non-JSON server error. */ }
    throw new Error(message)
  }
  return response.blob()
}

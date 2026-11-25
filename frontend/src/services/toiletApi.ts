import type { HygieneStatus as SharedHygieneStatus } from '../types/toilet'
import * as SecureStore from 'expo-secure-store'

export type HygieneStatus = SharedHygieneStatus
export interface Coordinates { latitude: number; longitude: number }
export type IssueType = 'CLOSED' | 'WRONG_LOCATION' | 'WRONG_PASSWORD' | 'OTHER'
export type IssueStatus = 'RECEIVED' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED'
export interface ToiletSummary { id: number; name: string; address: string; latitude: number; longitude: number; distanceMeter: number | null; isOpenNow: boolean | null; openTimeInfo: string | null; hasDisabledToilet: boolean | null; hasDiaperTable: boolean | null; hasTissue: boolean | null; hygieneStatus: HygieneStatus | null }
export interface ToiletDetail extends ToiletSummary { recentReports?: Array<{ id: number; comment: string | null; createdAt: string | null }> }
export interface MyReport { id: number; reportKind: 'TOILET_STATUS' | 'ISSUE'; toilet: { id: number; name: string; address: string }; type: string; content: string; status: IssueStatus | null; createdAt: string; reviewMemo?: string | null; reviewedAt?: string | null }
interface ApiResponse<T> { success: boolean; message: string; data: T | null }
export interface AccountUser { id: number; username: string }
export interface AccountSession { accessToken: string; tokenType: 'Bearer'; expiresAt: string; user: AccountUser }

let deviceIdPromise: Promise<string> | null = null
let accessToken: string | null = null
export function getDeviceId(): Promise<string> {
  if (!deviceIdPromise) deviceIdPromise = SecureStore.getItemAsync('open-toilet-device-id')
    .then(async (existing) => {
      if (existing) return existing
      const generated = `mobile-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 14)}`
      await SecureStore.setItemAsync('open-toilet-device-id', generated)
      return generated
    })
    .catch(() => `mobile-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 14)}`)
  return deviceIdPromise
}

async function request<T>(base: string, path: string, init?: RequestInit): Promise<T> {
  let response: Response
  try { response = await fetch(`${base.replace(/\/$/, '')}${path}`, { ...init, headers: { Accept: 'application/json', ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}), ...init?.headers } }) }
  catch { throw new Error('백엔드에 연결하지 못했습니다. 앱의 EXPO_PUBLIC_API_BASE_URL과 서버 상태를 확인해 주세요.') }
  const payload = await response.json().catch(() => null) as ApiResponse<T> | null
  if (!response.ok) throw new Error(payload?.message || `요청 실패 (HTTP ${response.status})`)
  if (!payload?.success || payload.data === null) throw new Error(payload?.message || '서버 응답 형식이 올바르지 않습니다.')
  return payload.data
}

export function searchToilets(base: string, keyword: string) { return request<ToiletSummary[]>(base, `/toilets/search?${new URLSearchParams({ keyword })}`) }
export function getNearby(base: string, location: Coordinates) { const query = new URLSearchParams({ lat: String(location.latitude), lng: String(location.longitude), radiusMeter: '1000' }); return request<ToiletSummary[]>(base, `/toilets/nearby?${query}`) }
export function getToilet(base: string, id: number) { return request<ToiletDetail>(base, `/toilets/${id}`) }
export async function submitStatus(base: string, id: number, body: { hasTissue: boolean; hygieneStatus: HygieneStatus; isOpen: boolean; comment: string }) { return request<number>(base, `/toilets/${id}/reports`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Device-Id': await getDeviceId() }, body: JSON.stringify(body) }) }
export async function submitIssue(base: string, id: number, issueType: IssueType, content: string) { return request<number>(base, `/toilets/${id}/issues`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Device-Id': await getDeviceId() }, body: JSON.stringify({ issueType, content }) }) }
export async function getMyReports(base: string) { return request<MyReport[]>(base, '/reports/me', { headers: { 'X-Device-Id': await getDeviceId() } }) }

export async function uploadReportImage(base: string, kind: 'TOILET_STATUS' | 'ISSUE', reportId: number, toiletId: number, uri: string) {
  const isPng = uri.toLowerCase().split(/[?#]/)[0].endsWith('.png')
  const form = new FormData()
  form.append('file', { uri, name: isPng ? 'toilet-report.png' : 'toilet-report.jpg', type: isPng ? 'image/png' : 'image/jpeg' } as unknown as Blob)
  const query = new URLSearchParams({ kind, reportId: String(reportId), toiletId: String(toiletId) })
  return request<{ id: number; url: string; mediaType: string; fileSize: number; createdAt: string }>(base, `/report-images?${query}`, {
    method: 'POST', headers: { 'X-Device-Id': await getDeviceId() }, body: form,
  })
}

export async function registerAccount(base: string, username: string, password: string) {
  const session = await request<AccountSession>(base, '/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) })
  await storeSession(session.accessToken)
  return session.user
}

export async function loginAccount(base: string, username: string, password: string) {
  const session = await request<AccountSession>(base, '/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) })
  await storeSession(session.accessToken)
  return session.user
}

export async function restoreAccount(base: string): Promise<AccountUser | null> {
  try {
    accessToken = await SecureStore.getItemAsync('open-toilet-access-token')
    if (!accessToken) return null
    return await request<AccountUser>(base, '/auth/me')
  } catch {
    accessToken = null
    await SecureStore.deleteItemAsync('open-toilet-access-token').catch(() => undefined)
    return null
  }
}

export async function logoutAccount(base: string) {
  try { if (accessToken) await request<boolean>(base, '/auth/logout', { method: 'POST' }) }
  finally {
    accessToken = null
    await SecureStore.deleteItemAsync('open-toilet-access-token').catch(() => undefined)
  }
}

async function storeSession(token: string) {
  accessToken = token
  await SecureStore.setItemAsync('open-toilet-access-token', token)
}

import { requestData, requestImage } from './client'
import type { Coordinates, IssueReport, IssueStatus, IssueType, MyReport, ToiletDetail, ToiletSummary } from '../types/toilet'
import { getDeviceId } from '../utils/deviceId'

export function searchToilets(keyword: string, coordinates?: Coordinates): Promise<ToiletSummary[]> {
  const query = new URLSearchParams({ keyword })
  if (coordinates) {
    query.set('lat', String(coordinates.latitude))
    query.set('lng', String(coordinates.longitude))
  }
  return requestData<ToiletSummary[]>(`/toilets/search?${query.toString()}`)
}

export function findNearbyToilets(coordinates: Coordinates): Promise<ToiletSummary[]> {
  const query = new URLSearchParams({
    lat: String(coordinates.latitude),
    lng: String(coordinates.longitude),
    radiusMeter: '500',
  })
  return requestData<ToiletSummary[]>(`/toilets/nearby?${query.toString()}`)
}

export function getToiletDetail(id: string, coordinates?: Coordinates): Promise<ToiletDetail> {
  const query = new URLSearchParams()
  if (coordinates) {
    query.set('lat', String(coordinates.latitude))
    query.set('lng', String(coordinates.longitude))
  }
  const suffix = query.size > 0 ? `?${query.toString()}` : ''
  return requestData<ToiletDetail>(`/toilets/${encodeURIComponent(id)}${suffix}`)
}

export function submitIssue(toiletId: number, issueType: IssueType, content: string): Promise<number> {
  return requestData<number>(`/toilets/${toiletId}/issues`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Device-Id': getDeviceId() }, body: JSON.stringify({ issueType, content }),
  })
}

export function submitToiletReport(toiletId: number, data: { hasTissue: boolean; hygieneStatus: 'CLEAN' | 'NORMAL' | 'DIRTY'; isOpen: boolean; comment: string }): Promise<number> {
  return requestData<number>(`/toilets/${toiletId}/reports`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Device-Id': getDeviceId() }, body: JSON.stringify(data),
  })
}

export function getMyReports(): Promise<MyReport[]> {
  return requestData<MyReport[]>('/reports/me', { headers: { 'X-Device-Id': getDeviceId() } })
}

export function getIssueReports(status?: IssueStatus, authorization?: string): Promise<IssueReport[]> {
  const query = status ? `?status=${encodeURIComponent(status)}` : ''
  return requestData<IssueReport[]>(`/toilets/issues${query}`, authorization ? { headers: { Authorization: authorization } } : undefined)
}

export function updateIssueStatus(id: number, status: IssueStatus, authorization?: string, review?: { reviewMemo?: string; toiletUpdates?: Record<string, boolean | string> }): Promise<null> {
  return requestData<null>(`/toilets/issues/${id}/status?status=${encodeURIComponent(status)}`, {
    method: 'PATCH',
    headers: { ...(authorization ? { Authorization: authorization } : {}), ...(review ? { 'Content-Type': 'application/json' } : {}) },
    ...(review ? { body: JSON.stringify(review) } : {}),
  })
}

export interface DataImportResult { imported: number; duplicates: number; skipped: number; errors: string[] }

export interface ReportImage { id: number; url: string; mediaType: string; fileSize: number; createdAt: string }

export function uploadReportImage(kind: 'TOILET_STATUS' | 'ISSUE', reportId: number, toiletId: number, file: File) {
  const form = new FormData()
  form.append('kind', kind)
  form.append('reportId', String(reportId))
  form.append('toiletId', String(toiletId))
  form.append('file', file)
  return requestData<ReportImage>('/report-images', { method: 'POST', headers: { 'X-Device-Id': getDeviceId() }, body: form })
}

export function getReportImages(kind: 'TOILET_STATUS' | 'ISSUE', reportId: number, authorization?: string) {
  const query = new URLSearchParams({ kind, reportId: String(reportId) })
  return requestData<ReportImage[]>(`/report-images?${query}`, {
    headers: { 'X-Device-Id': getDeviceId(), ...(authorization ? { Authorization: authorization } : {}) },
  })
}

export async function loadReportImage(imageId: number, authorization?: string) {
  return requestImage(`/report-images/${imageId}`, {
    headers: { 'X-Device-Id': getDeviceId(), ...(authorization ? { Authorization: authorization } : {}) },
  })
}

export function importToiletData(file: File, authorization: string): Promise<DataImportResult> {
  const form = new FormData()
  form.append('file', file)
  return requestData<DataImportResult>('/admin/import', {
    method: 'POST',
    headers: { Authorization: authorization },
    body: form,
  })
}

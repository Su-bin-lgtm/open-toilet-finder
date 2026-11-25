export type HygieneStatus = 'CLEAN' | 'NORMAL' | 'DIRTY'
export type IssueType = 'CLOSED' | 'WRONG_LOCATION' | 'WRONG_PASSWORD' | 'OTHER'
export type IssueStatus = 'RECEIVED' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED'

export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T | null
}

export interface Coordinates {
  latitude: number
  longitude: number
}

export interface ToiletSummary {
  id: number
  name: string
  address: string
  lotAddress?: string | null
  facilityType?: string | null
  latitude: number | null
  longitude: number | null
  distanceMeter: number | null
  isOpenNow: boolean | null
  openTimeInfo: string | null
  hasDisabledToilet: boolean | null
  hasDiaperTable: boolean | null
  hasTissue: boolean | null
  hygieneStatus: HygieneStatus | null
}

export interface ToiletReport {
  id: number
  hasTissue: boolean | null
  hygieneStatus: HygieneStatus | null
  isOpen: boolean | null
  doorLockCode: string | null
  comment: string | null
  createdAt: string | null
}

export interface ToiletDetail extends ToiletSummary {
  doorLockCode: string | null
  isUnisex: boolean | null
  maleWaterClosetCount: number | null
  maleUrinalCount: number | null
  femaleWaterClosetCount: number | null
  emergencyBell: boolean | null
  cctvInstalled: boolean | null
  managementAgency: string | null
  phoneNumber: string | null
  recentReports: ToiletReport[]
  updatedAt: string | null
}

export type SearchCriteria =
  | { kind: 'keyword'; keyword: string; coordinates?: Coordinates }
  | { kind: 'nearby'; coordinates: Coordinates }

export interface IssueReport {
  id: number
  toilet: { id: number; name: string; address: string } | null
  issueType: IssueType
  content: string
  status: IssueStatus
  createdAt: string
  reviewMemo?: string | null
  reviewedAt?: string | null
}

export interface MyReport {
  id: number
  reportKind: 'TOILET_STATUS' | 'ISSUE'
  toilet: { id: number; name: string; address: string }
  type: string
  content: string
  status: IssueStatus | null
  createdAt: string
  reviewMemo?: string | null
  reviewedAt?: string | null
}

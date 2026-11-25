import type { IssueReport, ToiletSummary } from '../types/toilet'

export const demoToilets: ToiletSummary[] = [
  { id: 101, name: '시청역 개방화장실', address: '서울 중구 세종대로 110', latitude: 37.5663, longitude: 126.9779, distanceMeter: 180, isOpenNow: true, openTimeInfo: '24시간 개방', hasDisabledToilet: true, hasDiaperTable: true, hasTissue: true, hygieneStatus: 'CLEAN' },
  { id: 102, name: '을지로입구역 화장실', address: '서울 중구 을지로 42', latitude: 37.5661, longitude: 126.9827, distanceMeter: 430, isOpenNow: true, openTimeInfo: '05:30–24:00', hasDisabledToilet: true, hasDiaperTable: false, hasTissue: true, hygieneStatus: 'NORMAL' },
  { id: 103, name: '서울광장 화장실', address: '서울 중구 을지로 12', latitude: 37.5655, longitude: 126.9782, distanceMeter: 520, isOpenNow: false, openTimeInfo: '09:00–18:00', hasDisabledToilet: false, hasDiaperTable: false, hasTissue: null, hygieneStatus: null },
]

export const demoIssueReports: IssueReport[] = [
  { id: 2401, toilet: { id: 101, name: '시청역 개방화장실', address: '서울 중구 세종대로 110' }, issueType: 'OTHER', content: '[시설 고장] 세면대 수도꼭지에서 물이 계속 새고 있습니다.', status: 'RECEIVED', createdAt: '2026-11-17T14:20:00' },
  { id: 2402, toilet: { id: 102, name: '을지로입구역 화장실', address: '서울 중구 을지로 42' }, issueType: 'WRONG_PASSWORD', content: '[출입 정보 오류] 안내된 출입 번호가 맞지 않습니다.', status: 'IN_PROGRESS', createdAt: '2026-11-17T11:05:00' },
  { id: 2403, toilet: { id: 103, name: '서울광장 화장실', address: '서울 중구 을지로 12' }, issueType: 'CLOSED', content: '[운영시간 오류] 평일 저녁에도 문이 닫혀 있습니다.', status: 'RESOLVED', createdAt: '2026-11-16T17:40:00' },
  { id: 2404, toilet: { id: 101, name: '시청역 개방화장실', address: '서울 중구 세종대로 110' }, issueType: 'OTHER', content: '[휴지 부족] 여자 화장실 칸에 휴지가 없습니다.', status: 'REJECTED', createdAt: '2026-11-15T09:10:00' },
  { id: 2405, toilet: { id: 104, name: '무교동 공중화장실', address: '서울 중구 무교로 21' }, issueType: 'WRONG_LOCATION', content: '[시설 고장] 지도에 표시된 입구가 공사 중입니다.', status: 'RECEIVED', createdAt: '2026-11-14T15:30:00' },
]

export const demoMine = [
  { id: 874, toilet: '시청역 개방화장실', type: '휴지 부족', content: '휴지통 옆 보관함에도 여분이 없어요.', status: 'IN_PROGRESS', date: '2026-11-17 14:20', result: '담당자 확인 중입니다.' },
  { id: 869, toilet: '을지로입구역 화장실', type: '출입 정보 오류', content: '안내된 비밀번호로 문이 열리지 않습니다.', status: 'RESOLVED', date: '2026-11-15 10:42', result: '출입 정보를 확인했습니다.' },
  { id: 852, toilet: '서울광장 화장실', type: '시설 고장', content: '세면대 한 곳에서 물이 새고 있습니다.', status: 'REJECTED', date: '2026-11-12 18:05', result: '위치 확인이 어려워 반려되었습니다.' },
  { id: 830, toilet: '무교동 공중화장실', type: '운영시간 오류', content: '안내된 시간보다 일찍 문이 닫힙니다.', status: 'RECEIVED', date: '2026-11-10 08:32', result: '관리자 검토 대기' },
  { id: 828, toilet: '서울숲 공원 입구 화장실', type: '시설 고장', content: '손 건조기가 작동하지 않아 확인이 필요합니다.', status: 'RESOLVED', date: '2026-11-08 12:30', result: '시설 상태를 확인해 조치했습니다.' },
]

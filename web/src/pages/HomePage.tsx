import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { findNearbyToilets, getToiletDetail, searchToilets } from '../api/toilets'
import { AppHeader } from '../components/AppHeader'
import { Icon } from '../components/Icon'
import { hasNaverMapClientId, NaverMap } from '../components/NaverMap'
import { demoToilets } from '../data/demoFixtures'
import { useCurrentLocation } from '../hooks/useCurrentLocation'
import type { Coordinates, ToiletDetail, ToiletSummary } from '../types/toilet'
import { isDevelopmentFixture } from '../utils/isDevelopmentFixture'

const demoMode = import.meta.env.VITE_DEMO_MODE === 'true'
function coordinatesFor(item: ToiletSummary): Coordinates | null {
  const latitude = typeof item.latitude === 'string' ? Number(item.latitude) : item.latitude
  const longitude = typeof item.longitude === 'string' ? Number(item.longitude) : item.longitude
  if (typeof latitude !== 'number' || !Number.isFinite(latitude) || latitude < -90 || latitude > 90
    || typeof longitude !== 'number' || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) return null
  return { latitude, longitude }
}

function coordinateQuality(item: ToiletSummary): 'valid' | 'missing' | 'invalid' {
  const latitude: unknown = item.latitude
  const longitude: unknown = item.longitude
  const isMissing = latitude === null || latitude === undefined || latitude === ''
    || longitude === null || longitude === undefined || longitude === ''
  return isMissing ? 'missing' : coordinatesFor(item) ? 'valid' : 'invalid'
}

function haversineMeters(from: Coordinates, to: Coordinates) {
  const radians = (degrees: number) => degrees * Math.PI / 180
  const latitudeDelta = radians(to.latitude - from.latitude)
  const longitudeDelta = radians(to.longitude - from.longitude)
  const value = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(radians(from.latitude)) * Math.cos(radians(to.latitude)) * Math.sin(longitudeDelta / 2) ** 2
  return Math.round(6_371_000 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value)))
}

function sortByDistance(items: ToiletSummary[], origin: Coordinates) {
  return items.map((item, index) => {
    const coordinates = coordinatesFor(item)
    return { item: coordinates ? { ...item, distanceMeter: haversineMeters(origin, coordinates) } : { ...item, distanceMeter: null }, index, distance: coordinates ? haversineMeters(origin, coordinates) : null }
  }).sort((a, b) => {
    if (a.distance === null && b.distance !== null) return 1
    if (a.distance !== null && b.distance === null) return -1
    return a.distance === null || b.distance === null ? a.index - b.index : a.distance - b.distance
  }).map(({ item }) => item)
}

function validCoordinateCount(items: ToiletSummary[]) {
  return items.filter((item) => coordinatesFor(item) !== null).length
}

function SchematicMap({ toilets, selected, currentLocation, onSelect }: { toilets: ToiletSummary[]; selected: number | null; currentLocation: Coordinates | null; onSelect: (id: number) => void }) {
  const locatedToilets = useMemo(() => toilets.filter((item) => Number.isFinite(item.latitude) && Number.isFinite(item.longitude)), [toilets])
  const points = useMemo(() => {
    if (!locatedToilets.length) return []
    const lats = [...locatedToilets.map((item) => item.latitude!), ...(currentLocation ? [currentLocation.latitude] : [])]
    const lngs = [...locatedToilets.map((item) => item.longitude!), ...(currentLocation ? [currentLocation.longitude] : [])]
    const minLat = Math.min(...lats) - 0.003, maxLat = Math.max(...lats) + 0.003
    const minLng = Math.min(...lngs) - 0.003, maxLng = Math.max(...lngs) + 0.003
    return locatedToilets.map((item) => ({ item, x: 12 + ((item.longitude! - minLng) / (maxLng - minLng || 1)) * 76, y: 12 + (1 - (item.latitude! - minLat) / (maxLat - minLat || 1)) * 76 }))
  }, [locatedToilets, currentLocation])
  const currentPoint = useMemo(() => {
    if (!currentLocation) return null
    const lats = [...locatedToilets.map((item) => item.latitude!), currentLocation.latitude]
    const lngs = [...locatedToilets.map((item) => item.longitude!), currentLocation.longitude]
    const minLat = Math.min(...lats) - 0.003, maxLat = Math.max(...lats) + 0.003
    const minLng = Math.min(...lngs) - 0.003, maxLng = Math.max(...lngs) + 0.003
    return { x: 12 + ((currentLocation.longitude - minLng) / (maxLng - minLng || 1)) * 76, y: 12 + (1 - (currentLocation.latitude - minLat) / (maxLat - minLat || 1)) * 76 }
  }, [locatedToilets, currentLocation])
  return <div className="map-stage" role="region" aria-label="화장실 위치 도식 지도">
    <svg className="map-drawing" viewBox="0 0 800 700" preserveAspectRatio="none" aria-hidden="true">
      <rect width="800" height="700" fill="#edf2ec" />
      <path d="M-40 125 C140 175 245 115 420 158 S690 205 850 130 L850 235 C650 285 550 210 390 222 S130 280 -30 225Z" fill="#d8e8f0" />
      <g fill="none" stroke="#fff" strokeWidth="18" strokeLinecap="round">
        <path d="M-20 350 L850 420"/><path d="M55 -20 L150 730"/><path d="M340 -20 L305 730"/><path d="M620 -20 L565 730"/><path d="M-30 565 L850 490"/><path d="M-10 275 L850 310"/>
      </g>
      <g fill="none" stroke="#d8ded8" strokeWidth="2"><path d="M-20 350 L850 420"/><path d="M55 -20 L150 730"/><path d="M340 -20 L305 730"/><path d="M620 -20 L565 730"/><path d="M-30 565 L850 490"/><path d="M-10 275 L850 310"/></g>
      <g fill="#dde8d9"><rect x="190" y="365" width="92" height="110" rx="12"/><rect x="400" y="300" width="105" height="92" rx="12"/><rect x="618" y="365" width="112" height="105" rx="12"/><rect x="160" y="70" width="128" height="78" rx="12"/><rect x="435" y="520" width="95" height="88" rx="12"/></g>
      <g fill="#7d8a82" fontSize="18" fontFamily="sans-serif"><text x="345" y="275">중구청</text><text x="514" y="180">을지로</text><text x="218" y="520">서울광장</text></g>
    </svg>
    {points.map(({ item, x, y }) => <button key={item.id} className={`map-marker ${selected === item.id ? 'is-selected' : ''}`} style={{ left: `${x}%`, top: `${y}%` }} onClick={() => onSelect(item.id)} aria-label={`${item.name} 선택`} title={item.name}><Icon name="toilet" size={17}/></button>)}
    {currentPoint && <span className="current-location-marker" style={{ left: `${currentPoint.x}%`, top: `${currentPoint.y}%` }} role="img" aria-label="현재 위치" title="현재 위치"/>}
    <div className="map-caption">위치 미리보기 · 실제 지도와 다를 수 있습니다.</div>
    <div className="map-zoom"><button type="button" aria-label="확대">＋</button><button type="button" aria-label="축소">−</button></div>
  </div>
}

export function HomePage() {
  const [keyword, setKeyword] = useState('')
  const [toilets, setToilets] = useState<ToiletSummary[]>(demoMode ? demoToilets : [])
  const [selected, setSelected] = useState<ToiletSummary | null>(demoMode ? demoToilets[0] : null)
  const [detail, setDetail] = useState<ToiletDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [filterAccessible, setFilterAccessible] = useState(false)
  const [filterDiaper, setFilterDiaper] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)
  const [filterHours, setFilterHours] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [currentLocation, setCurrentLocation] = useState<Coordinates | null>(null)
  const [nearestFirst, setNearestFirst] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)
  const { getCurrentLocation, isLoading: locating, error: locationError } = useCurrentLocation()
  const navigate = useNavigate()
  const hasFilters = filterAccessible || filterDiaper || filterOpen || filterHours
  const shown = useMemo(() => {
    const filtered = toilets.filter((item) => (!filterAccessible || item.hasDisabledToilet)
    && (!filterDiaper || item.hasDiaperTable)
    && (!filterOpen || item.isOpenNow === true)
    && (!filterHours || item.openTimeInfo != null))
    return nearestFirst && currentLocation ? sortByDistance(filtered, currentLocation) : filtered
  }, [toilets, filterAccessible, filterDiaper, filterOpen, filterHours, nearestFirst, currentLocation])

  useEffect(() => {
    if (!selected || demoMode) { setDetail(null); return }
    let active = true
    getToiletDetail(String(selected.id)).then((value) => { if (active) setDetail(value) }).catch(() => { if (active) setDetail(null) })
    return () => { active = false }
  }, [selected])

  async function runSearch(event?: FormEvent, nearby = false) {
    event?.preventDefault()
    setLoading(true); setError(null)
    try {
      if (nearby) setCurrentLocation(null)
      const coordinates = nearby ? await getCurrentLocation() : null
      setCurrentLocation(coordinates)
      const result = nearby && coordinates ? await findNearbyToilets(coordinates) : await searchToilets(keyword.trim())
      if (import.meta.env.DEV) {
        const coordinateCount = validCoordinateCount(result)
        console.info('[OpenToilet] 검색 API 응답', {
          responseCount: result.length,
          validCoordinateCount: coordinateCount,
          missingCoordinateCount: result.filter((item) => coordinateQuality(item) === 'missing').length,
          invalidCoordinateCount: result.filter((item) => coordinateQuality(item) === 'invalid').length,
          latitudeType: result[0] ? typeof result[0].latitude : 'no-results',
          longitudeType: result[0] ? typeof result[0].longitude : 'no-results',
          firstResult: result[0] ? { id: result[0].id, latitude: result[0].latitude, longitude: result[0].longitude } : null,
        })
      }
      const userResults = demoMode ? result : result.filter((item) => !isDevelopmentFixture(item))
      if (import.meta.env.DEV) console.info('[OpenToilet] 화면 표시 결과', { apiCount: result.length, visibleCount: userResults.length })
      const distanceOrigin = coordinates ?? (nearestFirst ? currentLocation : null)
      const orderedResults = distanceOrigin ? sortByDistance(userResults, distanceOrigin) : userResults
      if (nearby && coordinates) setNearestFirst(true)
      setToilets(orderedResults); setSelected(orderedResults[0] ?? null); setHasSearched(true)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '화장실 정보를 불러오지 못했습니다.')
      if (!demoMode) { setToilets([]); setSelected(null) }
    } finally { setLoading(false) }
  }

  const activeDetail = detail && selected?.id === detail.id ? detail : null
  return <div className="app-shell"><AppHeader />
    {demoMode && <div className="demo-banner">시연용 예시 정보입니다. 실제 운영 정보와 다를 수 있습니다.</div>}
    <main className="nearby-layout">
      <aside className="nearby-sidebar">
        <div className="sidebar-heading"><div><span className="eyebrow">OPEN TOILET FINDER</span><h1>주변 화장실</h1></div><span className="tiny-counter">{shown.length}곳</span></div>
        <form className="area-search" onSubmit={(event) => void runSearch(event)}><Icon name="search" size={18}/><input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="지역, 주소 또는 화장실 검색" aria-label="지역, 주소 또는 화장실 검색"/><button type="submit">검색</button></form>
        <button className="location-action" type="button" disabled={locating || loading} onClick={() => void runSearch(undefined, true)}><Icon name="pin" size={17}/>{locating ? '현재 위치 확인 중' : '현재 위치에서 찾기'}</button>
        {locationError && <p className="inline-error" role="alert">{locationError}</p>}
        <div className="filter-line"><strong>필터</strong><div className="filter-actions"><button type="button" className="nearest-sort" disabled={!currentLocation} aria-pressed={nearestFirst} title={currentLocation ? '현재 위치에서 가까운 순으로 정렬' : '현재 위치 검색 후 사용할 수 있습니다'} onClick={() => setNearestFirst((value) => !value)}>가까운 순{nearestFirst ? ' ✓' : ''}</button><button type="button" onClick={() => { setFilterAccessible(false); setFilterDiaper(false); setFilterOpen(false); setFilterHours(false) }}>초기화</button></div></div>
        <div className="filter-chips" aria-label="화장실 필터">
          <button type="button" className={!hasFilters ? 'active' : ''} onClick={() => { setFilterAccessible(false); setFilterDiaper(false); setFilterOpen(false); setFilterHours(false) }}>전체</button>
          <button type="button" className={filterAccessible ? 'active' : ''} onClick={() => setFilterAccessible((value) => !value)}>장애인 이용 가능</button>
          <button type="button" className={filterDiaper ? 'active' : ''} onClick={() => setFilterDiaper((value) => !value)}>기저귀 교환대</button>
          <button type="button" className={filterOpen ? 'active' : ''} onClick={() => setFilterOpen((value) => !value)}>이용 가능</button>
          <button type="button" className={filterHours ? 'active' : ''} onClick={() => setFilterHours((value) => !value)}>운영시간 확인</button>
        </div>
        <div className="nearby-list" aria-live="polite">
          {loading && <div className="list-message"><span className="spinner"/> 화장실 정보를 찾고 있습니다.</div>}
          {!loading && error && <div className="list-message error-copy">{error}<button onClick={() => void runSearch()}>다시 시도</button></div>}
          {!loading && !error && shown.length === 0 && <div className="list-message">{hasSearched ? '검색 결과가 없습니다. 다른 지역이나 검색어를 입력해 보세요.' : '지역이나 화장실 이름을 검색하거나 현재 위치를 확인해 보세요.'}</div>}
          {!loading && shown.map((toilet) => <button key={toilet.id} className={`nearby-item ${selected?.id === toilet.id ? 'active' : ''}`} onClick={() => { if (import.meta.env.DEV) console.info('[OpenToilet] 검색 목록 클릭', { selectedId: toilet.id, latitude: toilet.latitude, longitude: toilet.longitude, eventFired: true }); setSelected(toilet) }}>
            <span className="nearby-item-top"><i className={toilet.isOpenNow ? 'dot-open' : 'dot-closed'}/>{toilet.isOpenNow === null ? '운영 정보 없음' : toilet.isOpenNow ? '현재 이용 가능' : '현재 운영 종료'}<small>{toilet.distanceMeter == null ? '거리 정보 없음' : `${toilet.distanceMeter}m · 도보 약 ${Math.max(1, Math.round(toilet.distanceMeter / 70))}분`}</small></span>
            <span className="nearby-item-main"><span className="toilet-thumb" aria-label="등록된 사진 없음"><Icon name="toilet" size={20}/><small>사진 없음</small></span><span><strong>{toilet.name}</strong><span className="nearby-address">{toilet.address}</span><span className="nearby-time"><Icon name="clock" size={13}/>{toilet.openTimeInfo || '운영시간 정보 없음'}</span></span></span>
          </button>)}
        </div>
        <div className="sidebar-foot">정보는 공공데이터 및 사용자 제보를 바탕으로 제공됩니다.</div>
      </aside>
      <section className="map-column" aria-label="주변 화장실 지도"><div className="map-topbar"><strong>지도에서 찾기</strong><span>주변 화장실 위치</span><button type="button" onClick={() => void runSearch(undefined, true)}><Icon name="pin" size={15}/>현재 위치</button></div>{hasNaverMapClientId() && !mapError ? <NaverMap toilets={shown} selectedId={selected?.id ?? null} currentLocation={currentLocation} onSelect={(id) => { const item = toilets.find((toilet) => toilet.id === id) ?? null; if (import.meta.env.DEV) console.info('[OpenToilet] 지도 선택 전달', { markerId: id, selectedId: item?.id ?? null, idMatched: item?.id === id }); setSelected(item) }} onError={setMapError}/> : <SchematicMap toilets={shown} selected={selected?.id ?? null} currentLocation={currentLocation} onSelect={(id) => setSelected(toilets.find((item) => item.id === id) ?? null)}/>}{mapError && <div className="map-load-error" role="status">네이버 지도를 불러오지 못해 위치 미리보기를 표시합니다. {mapError}</div>}{!hasNaverMapClientId() && <div className="map-load-error" role="status">네이버 지도 Client ID를 설정하면 실제 지도를 표시합니다.</div>}</section>
      <aside className="toilet-detail-panel">
        {!selected ? <div className="detail-placeholder"><span>⌖</span><strong>화장실을 선택해 주세요</strong><p>목록이나 지도 마커를 선택하면 상세 정보가 표시됩니다.</p></div> : <>
          <div className="panel-photo"><span className="photo-pin"><Icon name="toilet" size={28}/></span><span>등록된 시설 사진이 없습니다.</span><button type="button" aria-label="즐겨찾기">♡</button></div>
          <div className="panel-content"><span className={`status-label ${selected.isOpenNow === null ? '' : selected.isOpenNow ? 'open' : 'closed'}`}>● {selected.isOpenNow === null ? '운영 정보 없음' : selected.isOpenNow ? '현재 이용 가능' : '현재 운영 종료'}</span><h2>{selected.name}</h2><p className="panel-address"><Icon name="pin" size={14}/>{selected.address}</p>
            <div className="panel-section"><h3>운영 정보</h3><div className="panel-row"><span>운영 시간</span><strong>{selected.openTimeInfo || '정보 없음'}</strong></div></div>
            <div className="panel-section"><h3>화장실 및 편의시설</h3><div className="facility-chips"><span>{selected.hasDisabledToilet ? '장애인 화장실' : '장애인 정보 없음'}</span><span>{selected.hasDiaperTable ? '기저귀 교환대' : '기저귀 정보 없음'}</span><span>{selected.hasTissue ? '휴지 비치' : '휴지 정보 없음'}</span></div><div className="panel-row"><span>남성 대변기</span><strong>{activeDetail?.maleWaterClosetCount == null ? '정보 없음' : `${activeDetail.maleWaterClosetCount}개`}</strong></div><div className="panel-row"><span>남성 소변기</span><strong>{activeDetail?.maleUrinalCount == null ? '정보 없음' : `${activeDetail.maleUrinalCount}개`}</strong></div><div className="panel-row"><span>여성 대변기</span><strong>{activeDetail?.femaleWaterClosetCount == null ? '정보 없음' : `${activeDetail.femaleWaterClosetCount}개`}</strong></div><div className="panel-row"><span>출입 정보</span><strong>{activeDetail?.doorLockCode || '현장 확인 필요'}</strong></div></div>
            <div className="panel-section recent-mini"><h3>최근 제보</h3>{activeDetail?.recentReports?.length ? <p>{activeDetail.recentReports[0].comment || activeDetail.recentReports[0].hygieneStatus}</p> : <p>{demoMode ? '최근 제보 예시 없음' : '최근 제보 정보가 없습니다.'}</p>}</div>
            <div className="panel-actions"><a className="button button-primary directions-button" href={`https://map.naver.com/p/search/${encodeURIComponent(`${selected.name} ${selected.address}`)}`} target="_blank" rel="noreferrer">네이버 지도 <span>↗</span></a><Link className="button button-outline" to={`/toilets/${selected.id}`}>상세 정보</Link></div><button className="report-error-link" type="button" onClick={() => navigate(`/report?toiletId=${selected.id}`)}>정보 오류 신고</button>
          </div>
        </>}
      </aside>
    </main>
  </div>
}

import { useEffect, useRef, useState } from 'react'
import type { Coordinates, ToiletSummary } from '../types/toilet'
import { loadNaverMaps } from '../utils/loadNaverMaps'

const NAVER_MAP_CLIENT_ID = import.meta.env.VITE_NAVER_MAP_CLIENT_ID?.trim() ?? ''
const MAX_MAP_MARKERS = 300

interface NaverMapProps {
  toilets: ToiletSummary[]
  selectedId: number | null
  currentLocation: Coordinates | null
  onSelect: (id: number) => void
  onError: (message: string) => void
}

function parseCoordinate(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value !== 'string' || value.trim() === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function getCoordinates(latitudeValue: unknown, longitudeValue: unknown): Coordinates | null {
  const latitude = parseCoordinate(latitudeValue)
  const longitude = parseCoordinate(longitudeValue)
  if (latitude === null || longitude === null
    || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null
  return { latitude, longitude }
}

function coordinateQuality(toilet: ToiletSummary): 'valid' | 'missing' | 'invalid' {
  const latitude: unknown = toilet.latitude
  const longitude: unknown = toilet.longitude
  const missing = latitude === null || latitude === undefined || latitude === ''
    || longitude === null || longitude === undefined || longitude === ''
  return missing ? 'missing' : getCoordinates(latitude, longitude) ? 'valid' : 'invalid'
}

function getMarkerColor(toilet: ToiletSummary, selected = false) {
  if (selected) return '#2878e8'
  if (toilet.isOpenNow === true) return '#16865b'
  if (toilet.isOpenNow === false) return '#758397'
  return '#7e8b99'
}

function createNumberedMarkerIcon(maps: NaverMapsNamespace, number: number, color: string) {
  const label = String(number)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="42" height="48" viewBox="0 0 42 48"><path d="M21 2C10.5 2 2 10.4 2 20.8 2 34 21 46 21 46s19-12 19-25.2C40 10.4 31.5 2 21 2Z" fill="${color}" stroke="#fff" stroke-width="3"/><circle cx="21" cy="20" r="12.5" fill="${color}"/><text x="21" y="24" text-anchor="middle" font-family="Arial,sans-serif" font-size="${label.length > 2 ? 9 : 11}" font-weight="700" fill="#fff">${label}</text></svg>`
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    size: new maps.Size(42, 48),
    anchor: new maps.Point(21, 46),
  }
}

export function hasNaverMapClientId() {
  return NAVER_MAP_CLIENT_ID.length > 0
}

export function NaverMap({ toilets, selectedId, currentLocation, onSelect, onError }: NaverMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<NaverMapInstance | null>(null)
  const mapsRef = useRef<NaverMapsNamespace | null>(null)
  const onSelectRef = useRef(onSelect)
  const onErrorRef = useRef(onError)
  const markerRefs = useRef<Map<number, NaverMarkerInstance>>(new Map())
  const overflowSelectedMarkerRef = useRef<NaverMarkerInstance | null>(null)
  const currentMarkerRef = useRef<NaverCircleInstance | null>(null)
  const selectedHighlightRef = useRef<NaverCircleInstance | null>(null)
  const infoWindowRef = useRef<NaverInfoWindowInstance | null>(null)
  const [mapReady, setMapReady] = useState(false)
  const [loading, setLoading] = useState(true)
  const [hasRenderedTiles, setHasRenderedTiles] = useState(false)

  useEffect(() => { onSelectRef.current = onSelect }, [onSelect])
  useEffect(() => { onErrorRef.current = onError }, [onError])

  useEffect(() => {
    let active = true
    let tileTimeout: number | undefined
    let layoutTimeout: number | undefined
    let layoutObserver: ResizeObserver | null = null
    let mapCreated = false
    let tilesLoaded = false
    const authFailure = () => {
      if (!active) return
      setLoading(false)
      onErrorRef.current('네이버 지도 인증에 실패했습니다. Web Dynamic Map 활성화와 서비스 URL을 확인해 주세요.')
    }
    window.addEventListener('naver-maps-auth-failure', authFailure)

    loadNaverMaps(NAVER_MAP_CLIENT_ID).then((maps) => {
      mapsRef.current = maps
      const initializeWhenVisible = () => {
        const container = containerRef.current
        if (!active || mapCreated || !container?.isConnected) return
        const { width, height } = container.getBoundingClientRect()
        if (width <= 0 || height <= 0) return

        mapCreated = true
        layoutObserver?.disconnect()
        try {
          const map = new maps.Map(container, {
            center: new maps.LatLng(37.5665, 126.978),
            zoom: 12,
            zoomControl: true,
            zoomControlOptions: { position: maps.Position.RIGHT_CENTER, style: maps.ZoomControlStyle.SMALL },
          })
          mapRef.current = map
          if (import.meta.env.DEV) {
            console.info('[OpenToilet] 지도 초기화 완료', {
              width: Math.round(width),
              height: Math.round(height),
              mapReady: true,
            })
          }
          tileTimeout = window.setTimeout(() => {
            if (!active || tilesLoaded) return
            setLoading(false)
            onErrorRef.current('지도 영역은 초기화됐지만 타일을 불러오지 못했습니다. 서비스 URL, 인증 오류 또는 네트워크를 확인해 주세요.')
          }, 12000)
          // `idle`은 지도 이동 완료 이벤트라서 최초 타일 로드 확인에 쓰지 않는다.
          maps.Event.addListener(map, 'tilesloaded', () => {
            if (!active) return
            tilesLoaded = true
            if (tileTimeout !== undefined) window.clearTimeout(tileTimeout)
            setHasRenderedTiles(true)
            setLoading(false)
          })
          setMapReady(true)
        } catch (error) {
          mapCreated = false
          setLoading(false)
          onErrorRef.current(error instanceof Error ? `네이버 지도 초기화에 실패했습니다: ${error.message}` : '네이버 지도 초기화에 실패했습니다.')
        }
      }

      const container = containerRef.current
      if (!container) {
        setLoading(false)
        onErrorRef.current('네이버 지도를 표시할 영역을 찾지 못했습니다.')
        return
      }
      layoutObserver = new ResizeObserver(initializeWhenVisible)
      layoutObserver.observe(container)
      initializeWhenVisible()
      layoutTimeout = window.setTimeout(() => {
        if (active && !mapCreated) {
          setLoading(false)
          onErrorRef.current('지도 표시 영역의 너비 또는 높이가 0입니다. 페이지 레이아웃을 확인해 주세요.')
        }
      }, 12000)
    }).catch((error: unknown) => {
      if (active) {
        setLoading(false)
        onErrorRef.current(error instanceof Error ? error.message : '네이버 지도를 불러오지 못했습니다.')
      }
    })

    return () => {
      active = false
      window.removeEventListener('naver-maps-auth-failure', authFailure)
      if (tileTimeout !== undefined) window.clearTimeout(tileTimeout)
      if (layoutTimeout !== undefined) window.clearTimeout(layoutTimeout)
      layoutObserver?.disconnect()
      markerRefs.current.forEach((marker) => marker.setMap(null))
      markerRefs.current.clear()
      overflowSelectedMarkerRef.current?.setMap(null)
      overflowSelectedMarkerRef.current = null
      currentMarkerRef.current?.setMap(null)
      currentMarkerRef.current = null
      selectedHighlightRef.current?.setMap(null)
      selectedHighlightRef.current = null
      infoWindowRef.current?.close()
      infoWindowRef.current = null
      mapRef.current?.destroy()
      mapRef.current = null
      mapsRef.current = null
    }
  }, [])

  useEffect(() => {
    const container = containerRef.current
    const map = mapRef.current
    if (!container || !map) return
    const observer = new ResizeObserver(() => map.autoResize())
    observer.observe(container)
    return () => observer.disconnect()
  }, [mapReady])

  useEffect(() => {
    const map = mapRef.current
    const maps = mapsRef.current
    if (!mapReady || !map || !maps) return

    markerRefs.current.forEach((marker) => marker.setMap(null))
    markerRefs.current.clear()
    overflowSelectedMarkerRef.current?.setMap(null)
    overflowSelectedMarkerRef.current = null
    currentMarkerRef.current?.setMap(null)
    currentMarkerRef.current = null
    selectedHighlightRef.current?.setMap(null)
    selectedHighlightRef.current = null

    const bounds = new maps.LatLngBounds()
    let positionCount = 0
    const located = toilets.flatMap((toilet) => {
      const coordinates = getCoordinates(toilet.latitude, toilet.longitude)
      return coordinates ? [{ toilet, coordinates }] : []
    })
    const markerToilets = located.slice(0, MAX_MAP_MARKERS)
    markerToilets.forEach(({ toilet, coordinates }, index) => {
      const position = new maps.LatLng(coordinates.latitude, coordinates.longitude)
      const marker = new maps.Marker({
        position,
        map,
        title: `${index + 1}. ${toilet.name}`,
        icon: createNumberedMarkerIcon(maps, index + 1, getMarkerColor(toilet, toilet.id === selectedId)),
      })
      maps.Event.addListener(marker, 'click', () => {
        if (import.meta.env.DEV) console.info('[OpenToilet] 지도 마커 클릭', { id: toilet.id })
        onSelectRef.current(toilet.id)
      })
      markerRefs.current.set(toilet.id, marker)
      bounds.extend(position)
      positionCount += 1
    })

    if (import.meta.env.DEV) {
      console.info('[OpenToilet] 지도 마커 동기화', {
        resultCount: toilets.length,
        validCoordinateCount: located.length,
        missingCoordinateCount: toilets.filter((toilet) => coordinateQuality(toilet) === 'missing').length,
        invalidCoordinateCount: toilets.filter((toilet) => coordinateQuality(toilet) === 'invalid').length,
        generatedMarkerCount: markerToilets.length,
        capped: located.length > MAX_MAP_MARKERS,
        latitudeType: toilets[0] ? typeof toilets[0].latitude : 'no-results',
        longitudeType: toilets[0] ? typeof toilets[0].longitude : 'no-results',
      })
    }

    const validCurrentLocation = currentLocation ? getCoordinates(currentLocation.latitude, currentLocation.longitude) : null
    if (validCurrentLocation) {
      const position = new maps.LatLng(validCurrentLocation.latitude, validCurrentLocation.longitude)
      currentMarkerRef.current = new maps.Circle({
        map,
        center: position,
        radius: 24,
        fillColor: '#2878e8',
        fillOpacity: 0.9,
        strokeColor: '#ffffff',
        strokeOpacity: 1,
        strokeWeight: 3,
      })
      bounds.extend(position)
      positionCount += 1
    }

    if (positionCount > 1) map.fitBounds(bounds, { top: 48, right: 48, bottom: 48, left: 48, maxZoom: 16 })
    else if (located.length) {
      map.setCenter(new maps.LatLng(located[0].coordinates.latitude, located[0].coordinates.longitude))
      map.setZoom(15)
    } else if (validCurrentLocation) {
      map.setCenter(new maps.LatLng(validCurrentLocation.latitude, validCurrentLocation.longitude))
      map.setZoom(15)
    }
  }, [mapReady, toilets, currentLocation])

  useEffect(() => {
    if (!mapReady || !mapRef.current || !mapsRef.current) return
    selectedHighlightRef.current?.setMap(null)
    selectedHighlightRef.current = null
    overflowSelectedMarkerRef.current?.setMap(null)
    overflowSelectedMarkerRef.current = null
    const maps = mapsRef.current
    markerRefs.current.forEach((marker, id) => {
      marker.setZIndex(10)
      const toilet = toilets.find((item) => item.id === id)
      if (toilet && maps) {
        const number = toilets.filter((item) => getCoordinates(item.latitude, item.longitude)).findIndex((item) => item.id === id) + 1
        marker.setIcon(createNumberedMarkerIcon(maps, number, getMarkerColor(toilet)))
      }
    })

    if (selectedId === null) {
      infoWindowRef.current?.close()
      return
    }
    const selected = toilets.find((toilet) => toilet.id === selectedId)
    const coordinates = selected ? getCoordinates(selected.latitude, selected.longitude) : null
    if (!selected || !coordinates) {
      if (import.meta.env.DEV) {
        console.info('[OpenToilet] 선택 화장실 좌표 없음 또는 결과 데이터 불일치', {
          selectedId,
          foundInMapData: Boolean(selected),
          latitudeType: selected ? typeof selected.latitude : 'missing',
          longitudeType: selected ? typeof selected.longitude : 'missing',
        })
      }
      infoWindowRef.current?.close()
      return
    }

    const selectedMarkerNumber = toilets.filter((item) => getCoordinates(item.latitude, item.longitude)).findIndex((item) => item.id === selected.id) + 1

    const activeMaps = mapsRef.current
    const map = mapRef.current
    if (!activeMaps) return
    const position = new activeMaps.LatLng(coordinates.latitude, coordinates.longitude)
    map.setZoom(16)
    map.panTo(position)
    if (import.meta.env.DEV) {
      console.info('[OpenToilet] 지도 이동 함수 실행', {
        selectedId,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        panToCalled: true,
        setZoomCalled: true,
      })
    }
    selectedHighlightRef.current = new activeMaps.Circle({
      map,
      center: position,
      radius: 42,
      fillColor: '#286fd1',
      fillOpacity: 0.12,
      strokeColor: '#174f9f',
      strokeOpacity: 0.95,
      strokeWeight: 3,
    })

    let marker = markerRefs.current.get(selected.id)
    let markerSource: 'search-results' | 'selected-overflow' = 'search-results'
    if (!marker) {
      marker = new activeMaps.Marker({
        position,
        map,
        title: `${selectedMarkerNumber}. ${selected.name}`,
        icon: createNumberedMarkerIcon(maps, selectedMarkerNumber, getMarkerColor(selected, true)),
      })
      activeMaps.Event.addListener(marker, 'click', () => {
        if (import.meta.env.DEV) console.info('[OpenToilet] 지도 마커 클릭', { id: selected.id })
        onSelectRef.current(selected.id)
      })
      overflowSelectedMarkerRef.current = marker
      markerSource = 'selected-overflow'
    }
    marker.setIcon(createNumberedMarkerIcon(maps, selectedMarkerNumber, getMarkerColor(selected, true)))
    if (import.meta.env.DEV) {
      console.info('[OpenToilet] 목록 선택 → 지도 이동 요청', {
        selectedId,
        markerId: selected.id,
        idMatched: selected.id === selectedId,
        markerSource,
        latitudeType: typeof selected.latitude,
        longitudeType: typeof selected.longitude,
        mapMoveRequested: true,
      })
    }
    marker.setZIndex(100)
    const content = document.createElement('div')
    content.className = 'naver-toilet-info'
    const heading = document.createElement('div')
    heading.className = 'naver-toilet-info-heading'
    const name = document.createElement('strong')
    name.textContent = selected.name
    const status = document.createElement('span')
    const isOpen = selected.isOpenNow
    status.className = `naver-toilet-info-status ${isOpen === true ? 'is-open' : isOpen === false ? 'is-closed' : 'is-unknown'}`
    status.textContent = isOpen === true ? '이용 가능' : isOpen === false ? '현재 운영 종료' : '운영 정보 없음'
    heading.append(name, status)
    const address = document.createElement('span')
    address.className = 'naver-toilet-info-address'
    address.textContent = selected.address
    const metrics = document.createElement('span')
    metrics.className = 'naver-toilet-info-metrics'
    metrics.textContent = selected.distanceMeter == null
      ? '거리 정보 없음'
      : `${selected.distanceMeter}m · 도보 약 ${Math.max(1, Math.round(selected.distanceMeter / 70))}분`
    const detailLink = document.createElement('a')
    detailLink.className = 'naver-toilet-info-link'
    detailLink.href = `/toilets/${selected.id}`
    detailLink.textContent = '상세 정보 보기'
    content.append(heading, address, metrics, detailLink)
    infoWindowRef.current ??= new activeMaps.InfoWindow({ maxWidth: 300 })
    infoWindowRef.current.setContent(content)
    infoWindowRef.current.open(map, marker)
  }, [mapReady, selectedId, toilets])

  const locatedCount = toilets.filter((toilet) => getCoordinates(toilet.latitude, toilet.longitude) !== null).length
  const selectedToilet = selectedId === null ? null : toilets.find((toilet) => toilet.id === selectedId) ?? null
  const selectedHasCoordinates = selectedToilet !== null && getCoordinates(selectedToilet.latitude, selectedToilet.longitude) !== null

  const hasAvailabilityState = toilets.some((toilet) => toilet.isOpenNow !== null)
  return <div className="naver-map-host" role="region" aria-label="네이버 화장실 지도">
    <div className="naver-map-canvas" ref={containerRef}/>
    <div className="naver-map-legend" aria-label="지도 마커 범례">
      {hasAvailabilityState && <><span><i className="legend-dot is-open"/>이용 가능</span><span><i className="legend-dot is-closed"/>현재 운영 종료</span></>}
      {!hasAvailabilityState && <span><i className="legend-dot is-unknown"/>운영 정보 없음</span>}
      <small>점검 상태 정보는 제공되지 않습니다.</small>
    </div>
    {loading && <div className="map-loading" role="status">네이버 지도를 불러오고 있습니다.</div>}
    {!loading && !hasRenderedTiles && <div className="naver-map-status" role="status">실제 지도 타일을 표시하지 못했습니다. 위치 미리보기를 확인해 주세요.</div>}
    {hasRenderedTiles && selectedToilet && !selectedHasCoordinates && <div className="naver-map-status" role="status">선택한 화장실은 좌표 정보가 없어 지도 이동이 불가능합니다. 검색 목록에서 주소를 확인해 주세요.</div>}
    {hasRenderedTiles && locatedCount === 0 && !currentLocation && !selectedToilet && <div className="naver-map-status" role="status">좌표가 있는 화장실이 없어 지도 마커를 표시할 수 없습니다. 검색 목록은 계속 이용할 수 있습니다.</div>}
    {hasRenderedTiles && locatedCount > MAX_MAP_MARKERS && <div className="naver-map-status map-marker-limit" role="status">좌표가 있는 {locatedCount}곳 중 {MAX_MAP_MARKERS}곳의 마커를 표시합니다. 목록에서 선택한 화장실은 별도로 표시됩니다.</div>}
    {selectedId !== null && <span className="sr-only">선택한 화장실: {toilets.find((item) => item.id === selectedId)?.name ?? ''}</span>}
  </div>
}

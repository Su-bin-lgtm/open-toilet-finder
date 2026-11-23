// 지도 (FE-08). Leaflet + OpenStreetMap 을 직접 DOM 에 그린다. (웹 전용)
// 지도 서비스(카카오·네이버 등)가 정해지면 이 파일과 services/leaflet.ts 만 바꾸면 되도록
// 화면은 아래 Props 로만 지도와 이야기한다.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createElement, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { loadLeaflet } from '../services/leaflet';
import { colors, radius, spacing } from '../theme';
import type { Coords } from '../types/toilet';

export interface MapToilet {
  id: string;
  number: number;
  latitude: number;
  longitude: number;
  name: string;
  statusLabel: string;
  /** 개방 상태에 따른 마커 색 */
  color: string;
  /** 팝업에 보이는 요약. 예: "180m · 도보 3분" */
  summary: string;
}

interface Props {
  /** 검색 기준 위치. 바뀌면 지도가 그 위치로 이동한다. */
  center: Coords;
  userLocation: Coords | null;
  toilets: MapToilet[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** "현 지도에서 검색": 지금 지도 가운데 좌표를 알려 준다. */
  onSearchHere: (center: Coords) => void;
  /** 오른쪽 아래 "내 위치" 버튼 */
  onLocate: () => void;
  /** 지도 위에 보이는 기준 위치 설명. 예: "내 위치 기준" */
  contextLabel: string;
}

const DEFAULT_ZOOM = 16;
const USER_COLOR = '#2457D6';

function markerHtml(number: number, color: string, selected: boolean): string {
  const size = selected ? 38 : 32;
  const font = selected ? 16 : 14;
  // number, color 는 앱이 만든 값(숫자·고정 색)이라 HTML 로 넣어도 안전하다.
  return (
    `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};color:#fff;` +
    `font:700 ${font}px sans-serif;display:flex;align-items:center;justify-content:center;` +
    `border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35);box-sizing:border-box">${number}</div>`
  );
}

/** 팝업 내용. 화장실 이름 같은 글자는 textContent 로만 넣어 HTML 이 해석되지 않게 한다. */
function popupNode(toilet: MapToilet): HTMLElement {
  const root = document.createElement('div');
  root.style.cssText = 'font:14px sans-serif;min-width:170px';
  const name = document.createElement('div');
  name.textContent = toilet.name;
  name.style.cssText = 'font-weight:700;margin-bottom:4px;color:#1F2937';
  const sub = document.createElement('div');
  sub.textContent = `${toilet.statusLabel} · ${toilet.summary}`;
  sub.style.cssText = `font-size:13px;color:${toilet.color}`;
  root.append(name, sub);
  return root;
}

export default function ToiletMap({
  center,
  userLocation,
  toilets,
  selectedId,
  onSelect,
  onSearchHere,
  onLocate,
  contextLabel,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markerLayerRef = useRef<any>(null);
  const userLayerRef = useRef<any>(null);
  const popupRef = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // 이벤트 안에서 항상 최신 값을 쓰도록 ref 에 보관
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const toiletsRef = useRef(toilets);
  toiletsRef.current = toilets;

  // 1) 지도 만들기 (처음 한 번)
  useEffect(() => {
    let cancelled = false;
    let observer: ResizeObserver | null = null;
    loadLeaflet()
      .then((L) => {
        const el = containerRef.current;
        if (cancelled || !el) return;
        const map = L.map(el, { zoomControl: false, attributionControl: false }).setView(
          [center.latitude, center.longitude],
          DEFAULT_ZOOM,
        );
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap contributors',
        }).addTo(map);
        L.control.attribution({ prefix: false, position: 'bottomright' }).addTo(map);
        markerLayerRef.current = L.layerGroup().addTo(map);
        userLayerRef.current = L.layerGroup().addTo(map);
        mapRef.current = map;
        // 화면 크기가 바뀌면 지도 크기도 다시 계산
        observer = new ResizeObserver(() => map.invalidateSize());
        observer.observe(el);
        setReady(true);
      })
      .catch((e) => {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : '지도를 불러오지 못했어요.');
      });
    return () => {
      cancelled = true;
      observer?.disconnect();
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // 2) 기준 위치가 바뀌면 지도 이동
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    map.setView([center.latitude, center.longitude], map.getZoom());
  }, [ready, center.latitude, center.longitude]);

  // 3) 마커와 선택된 곳의 팝업
  useEffect(() => {
    const map = mapRef.current;
    const layer = markerLayerRef.current;
    const L = (window as any).L;
    if (!ready || !map || !layer || !L) return;

    layer.clearLayers();
    toilets.forEach((toilet) => {
      const selected = toilet.id === selectedId;
      const size = selected ? 38 : 32;
      const icon = L.divIcon({
        className: '',
        html: markerHtml(toilet.number, toilet.color, selected),
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });
      L.marker([toilet.latitude, toilet.longitude], {
        icon,
        keyboard: false,
        zIndexOffset: selected ? 1000 : 0,
      })
        .on('click', () => onSelectRef.current(toilet.id))
        .addTo(layer);
    });

    // 팝업은 항상 하나만 유지한다. (이전 팝업을 지우지 않으면 선택을 바꿀 때마다 쌓인다)
    if (popupRef.current) {
      map.closePopup(popupRef.current);
      popupRef.current = null;
    }
    const selectedToilet = toilets.find((t) => t.id === selectedId);
    if (selectedToilet) {
      const popup = L.popup({ closeButton: false, closeOnClick: false, offset: [0, -22] })
        .setLatLng([selectedToilet.latitude, selectedToilet.longitude])
        .setContent(popupNode(selectedToilet));
      popup.openOn(map);
      popupRef.current = popup;
    }
  }, [ready, toilets, selectedId]);

  // 4) 선택이 바뀌면 그 마커로 부드럽게 이동 (1분마다 목록이 갱신될 때는 움직이지 않는다)
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map || !selectedId) return;
    const target = toiletsRef.current.find((t) => t.id === selectedId);
    if (target) map.panTo([target.latitude, target.longitude], { animate: true });
  }, [ready, selectedId]);

  // 5) 내 위치 (파란 점)
  const userLat = userLocation?.latitude;
  const userLng = userLocation?.longitude;
  useEffect(() => {
    const layer = userLayerRef.current;
    const L = (window as any).L;
    if (!ready || !layer || !L) return;
    layer.clearLayers();
    if (userLat === undefined || userLng === undefined) return;
    L.circleMarker([userLat, userLng], {
      radius: 18,
      stroke: false,
      fillColor: USER_COLOR,
      fillOpacity: 0.15,
      interactive: false,
    }).addTo(layer);
    L.circleMarker([userLat, userLng], {
      radius: 7,
      color: '#ffffff',
      weight: 3,
      fillColor: USER_COLOR,
      fillOpacity: 1,
      interactive: false,
    })
      .bindTooltip('내 위치', { permanent: true, direction: 'bottom', offset: [0, 8] })
      .addTo(layer);
  }, [ready, userLat, userLng]);

  const searchHere = () => {
    const c = mapRef.current?.getCenter();
    if (c) onSearchHere({ latitude: c.lat, longitude: c.lng });
  };

  return (
    <View style={styles.root}>
      {createElement('div', {
        ref: containerRef,
        // Leaflet 의 내부 겹침 순서가 위의 버튼들을 가리지 않도록 별도 층으로 분리
        style: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0, isolation: 'isolate' },
      })}

      {loadError ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{loadError}</Text>
          <Text style={styles.errorSub}>지도는 인터넷 연결이 필요해요. 목록과 상세 정보는 그대로 볼 수 있어요.</Text>
        </View>
      ) : null}

      <View style={styles.topRow} pointerEvents="box-none">
        <View style={styles.contextChip}>
          <Text style={styles.contextText}>📍 {contextLabel}</Text>
        </View>
      </View>
      <View style={styles.searchHereWrap} pointerEvents="box-none">
        <Pressable onPress={searchHere} accessibilityRole="button" style={styles.searchHere}>
          <Text style={styles.searchHereText}>↻ 현 지도에서 검색</Text>
        </Pressable>
      </View>

      <View style={styles.legend}>
        <LegendItem color={colors.green} label="이용 가능" />
        <LegendItem color={colors.orangeMarker} label="점검 중" />
        <LegendItem color={colors.gray} label="운영 중지·종료" />
      </View>

      <View style={styles.controls}>
        <View style={styles.zoomBox}>
          <Pressable
            onPress={() => mapRef.current?.zoomIn()}
            accessibilityRole="button"
            accessibilityLabel="지도 확대"
            style={styles.zoomBtn}
          >
            <Text style={styles.zoomText}>+</Text>
          </Pressable>
          <View style={styles.zoomDivider} />
          <Pressable
            onPress={() => mapRef.current?.zoomOut()}
            accessibilityRole="button"
            accessibilityLabel="지도 축소"
            style={styles.zoomBtn}
          >
            <Text style={styles.zoomText}>−</Text>
          </Pressable>
        </View>
        <Pressable
          onPress={onLocate}
          accessibilityRole="button"
          accessibilityLabel="내 위치로 이동"
          style={styles.locateBtn}
        >
          <Text style={styles.locateText}>◎</Text>
        </Pressable>
      </View>
    </View>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#E5E7EB' },
  topRow: { position: 'absolute', top: spacing.lg, left: spacing.lg, zIndex: 10 },
  contextChip: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  contextText: { fontSize: 13, color: colors.text },
  searchHereWrap: {
    position: 'absolute',
    top: 64,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  searchHere: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  searchHereText: { fontSize: 13, fontWeight: '700', color: colors.primary },
  legend: {
    position: 'absolute',
    left: spacing.lg,
    bottom: spacing.xl,
    zIndex: 10,
    flexDirection: 'row',
    gap: spacing.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 12, color: colors.text },
  controls: { position: 'absolute', right: spacing.lg, bottom: 44, zIndex: 10, gap: spacing.sm },
  zoomBox: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  zoomBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  zoomText: { fontSize: 20, color: colors.text },
  zoomDivider: { height: 1, backgroundColor: colors.border },
  locateBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
  },
  locateText: { fontSize: 20, color: colors.primary },
  errorBox: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
    zIndex: 5,
  },
  errorText: { fontSize: 15, fontWeight: '700', color: colors.text },
  errorSub: { fontSize: 13, color: colors.subText, textAlign: 'center' },
});

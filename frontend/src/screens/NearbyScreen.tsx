// 주변 화장실 화면 (FE-08, 09, 10): 왼쪽 목록 · 가운데 지도 · 오른쪽 상세
import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { MARKER_COLOR } from '../components/StatusBadge';
import ToiletDetailPanel from '../components/ToiletDetailPanel';
import ToiletListPanel from '../components/ToiletListPanel';
import ToiletMap, { type MapToilet } from '../components/ToiletMap';
import { useNearbyToilets } from '../hooks/useNearbyToilets';
import { FALLBACK_CENTER } from '../services/config';
import {
  STATUS_LABEL,
  applyFilter,
  formatDistance,
  getDisplayStatus,
  hasAnyFilter,
  matchesQuery,
  sortToilets,
  walkMinutes,
} from '../services/toiletLogic';
import { colors } from '../theme';

const WIDE_LAYOUT_MIN_WIDTH = 1180; // 이보다 좁으면 상세 패널이 지도 위에 겹쳐서 열린다.
const LIST_WIDTH = 380;
const DETAIL_WIDTH = 400;

/** @param initialSelectedId 제보를 마치고 돌아올 때처럼, 처음부터 선택해 둘 화장실 */
export default function NearbyScreen({ initialSelectedId }: { initialSelectedId?: string }) {
  const {
    searchCenter,
    searchMode,
    userLocation,
    locationStatus,
    locationMessage,
    usingFallbackCenter,
    toilets,
    filter,
    setFilter,
    loading,
    error,
    now,
    locateAndSearch,
    searchAt,
    retry,
  } = useNearbyToilets();
  const { width } = useWindowDimensions();
  const wide = width >= WIDE_LAYOUT_MIN_WIDTH;

  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId ?? null);
  const [detailOpen, setDetailOpen] = useState(true);

  // 검색어 → 필터 → 정렬(이용 가능 우선, 가까운 순)
  const visible = useMemo(
    () => sortToilets(applyFilter(toilets.filter((t) => matchesQuery(t, query)), filter, now), now),
    [toilets, query, filter, now],
  );

  // 목록이 처음 도착하면 가장 앞의 화장실을 선택해서 상세를 보여 준다. (시안과 같은 첫 화면)
  const autoSelected = useRef(initialSelectedId !== undefined);
  useEffect(() => {
    if (!autoSelected.current && visible.length > 0) {
      autoSelected.current = true;
      setSelectedId(visible[0].id);
    }
  }, [visible]);

  // 필터·검색 때문에 사라진 화장실은 선택 상태로 두지 않는다.
  const selected = visible.find((t) => t.id === selectedId) ?? null;

  const mapToilets = useMemo<MapToilet[]>(
    () =>
      visible.map((t, index) => {
        const status = getDisplayStatus(t, now);
        return {
          id: t.id,
          number: index + 1,
          latitude: t.latitude,
          longitude: t.longitude,
          name: t.name,
          statusLabel: STATUS_LABEL[status],
          color: MARKER_COLOR[status],
          summary: `${formatDistance(t.distanceM)} · 도보 ${walkMinutes(t.distanceM)}분`,
        };
      }),
    [visible, now],
  );

  const select = (id: string) => {
    setSelectedId(id);
    setDetailOpen(true);
  };

  const center = searchCenter ?? FALLBACK_CENTER;
  const contextLabel =
    searchMode === 'map'
      ? '지도에서 정한 위치 기준'
      : usingFallbackCenter
        ? '기본 위치(서울시청) 기준'
        : '내 위치 기준';
  const title = searchMode === 'map' ? '지도 주변 화장실' : '내 주변 화장실';
  const areaLabel = searchMode === 'map' ? '지도 중심 기준' : usingFallbackCenter ? '기본 위치 주변' : '현재 위치 주변';

  let notice: string | undefined;
  if (searchMode === 'location' && usingFallbackCenter) {
    notice =
      locationStatus === 'denied'
        ? '위치 권한이 없어 기본 위치(서울시청) 기준이에요. 브라우저에서 위치를 허용한 뒤 ‘현재 위치로 찾기’를 눌러 주세요.'
        : (locationMessage ?? '위치를 알 수 없어 기본 위치(서울시청) 기준이에요.');
  }

  // 서버가 필터를 적용해서 주므로, 필터가 켜져 있으면 빈 결과도 "조건에 맞는 곳 없음"으로 안내한다.
  const emptyMessage =
    toilets.length === 0 && !hasAnyFilter(filter) && query.trim() === ''
      ? '주변 1km 안에 등록된 화장실이 없어요.'
      : '조건에 맞는 화장실이 없어요. 검색어나 필터를 바꿔 보세요.';

  return (
    <View style={styles.root}>
      <View style={styles.list}>
        <ToiletListPanel
          title={title}
          areaLabel={areaLabel}
          query={query}
          onQueryChange={setQuery}
          onLocate={() => void locateAndSearch()}
          locating={locationStatus === 'loading'}
          filter={filter}
          onFilterChange={setFilter}
          toilets={visible}
          now={now}
          selectedId={selected?.id ?? null}
          onSelect={select}
          loading={loading}
          error={error}
          onRetry={() => void retry()}
          notice={notice}
          emptyMessage={emptyMessage}
        />
      </View>

      <View style={styles.map}>
        <ToiletMap
          center={center}
          userLocation={userLocation}
          toilets={mapToilets}
          selectedId={selected?.id ?? null}
          onSelect={select}
          onSearchHere={(c) => void searchAt(c)}
          onLocate={() => void locateAndSearch()}
          contextLabel={contextLabel}
        />
        {!wide && selected && detailOpen ? (
          <View style={styles.overlay}>
            <ToiletDetailPanel toilet={selected} now={now} onClose={() => setDetailOpen(false)} />
          </View>
        ) : null}
      </View>

      {wide ? (
        <View style={styles.detail}>
          <ToiletDetailPanel toilet={selected} now={now} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row', backgroundColor: colors.background },
  list: { width: LIST_WIDTH, borderRightWidth: 1, borderRightColor: colors.border },
  map: { flex: 1 },
  detail: { width: DETAIL_WIDTH, borderLeftWidth: 1, borderLeftColor: colors.border },
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: DETAIL_WIDTH,
    maxWidth: '100%',
    zIndex: 20,
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
  },
});

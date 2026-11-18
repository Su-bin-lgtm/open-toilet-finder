import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import AppMap from '../components/AppMap';
import FilterBar from '../components/FilterBar';
import StateView from '../components/StateView';
import ToiletCard from '../components/ToiletCard';
import { STATUS_COLOR } from '../components/OpenBadge';
import { useNearbyToilets } from '../hooks/useNearbyToilets';
import type { TabProps } from '../navigation/types';
import { getAccessStatus } from '../services/toiletLogic';
import { colors, radius, spacing } from '../theme';

export default function MapScreen({ navigation }: TabProps<'Map'>) {
  const {
    center,
    usingFallbackCenter,
    visibleToilets,
    filter,
    setFilter,
    loading,
    error,
    refresh,
    now,
  } = useNearbyToilets();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // 지도에 넘기는 마커 목록은 값이 바뀔 때만 새로 만든다.
  const markers = useMemo(
    () =>
      visibleToilets.map((t) => ({
        id: t.id,
        latitude: t.latitude,
        longitude: t.longitude,
        name: t.name,
        color: STATUS_COLOR[getAccessStatus(t, now)],
      })),
    [visibleToilets, now],
  );

  if (!center) return <StateView kind="loading" message="내 위치를 찾는 중이에요…" />;

  // 필터 때문에 사라진 마커의 카드는 자동으로 닫힌다.
  const selected = visibleToilets.find((t) => t.id === selectedId) ?? null;

  return (
    <View style={styles.container}>
      <AppMap
        center={center}
        markers={markers}
        selectedId={selectedId}
        showUserLocation={!usingFallbackCenter}
        onMarkerPress={setSelectedId}
        onMapPress={() => setSelectedId(null)}
      />

      <View style={styles.top}>
        <FilterBar filter={filter} onChange={setFilter} />
        {usingFallbackCenter && (
          <Text style={styles.notice}>
            위치 권한이 없어 기본 위치(서울시청) 기준으로 보여 드려요. 위치를 허용한 뒤 아래
            버튼을 눌러 주세요.
          </Text>
        )}
        {error && <Text style={[styles.notice, styles.errorNotice]}>{error}</Text>}
      </View>

      <View style={styles.bottom}>
        <Pressable
          onPress={() => void refresh()}
          disabled={loading}
          accessibilityRole="button"
          style={styles.refreshButton}
        >
          {loading ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <Text style={styles.refreshText}>📍 내 위치에서 다시 찾기</Text>
          )}
        </Pressable>

        {selected ? (
          <ToiletCard
            toilet={selected}
            now={now}
            onPress={() => navigation.navigate('Detail', { toiletId: selected.id })}
          />
        ) : (
          !loading && (
            <Text style={styles.hint}>
              {visibleToilets.length > 0
                ? `주변 ${visibleToilets.length}곳 · 마커를 눌러 확인하세요`
                : '조건에 맞는 화장실이 없어요'}
            </Text>
          )
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  top: { position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: 'rgba(248,250,252,0.92)' },
  notice: {
    fontSize: 12,
    color: colors.text,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  errorNotice: { color: colors.danger },
  bottom: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.lg,
    gap: spacing.sm,
  },
  refreshButton: {
    alignSelf: 'center',
    minHeight: 40,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  refreshText: { fontSize: 14, fontWeight: '600', color: colors.primary },
  hint: {
    alignSelf: 'center',
    fontSize: 13,
    color: colors.text,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
});

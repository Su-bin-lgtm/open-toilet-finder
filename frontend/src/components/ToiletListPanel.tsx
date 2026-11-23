import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, radius, spacing } from '../theme';
import type { Toilet, ToiletFilter } from '../types/toilet';
import Chip from './Chip';
import ToiletCard from './ToiletCard';

interface Props {
  title: string;
  areaLabel: string;
  query: string;
  onQueryChange: (query: string) => void;
  onLocate: () => void;
  locating: boolean;
  filter: ToiletFilter;
  onFilterChange: (patch: Partial<ToiletFilter>) => void;
  toilets: Toilet[];
  now: Date;
  selectedId: string | null;
  onSelect: (id: string) => void;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  notice?: string;
  emptyMessage: string;
}

/** 왼쪽 패널: 검색, 현재 위치로 찾기, 필터, 목록 */
export default function ToiletListPanel(props: Props) {
  const { filter, onFilterChange, toilets, loading, error } = props;
  const noFilter = !filter.accessibleOnly && !filter.diaperTableOnly && !filter.availableOnly;

  return (
    <View style={styles.panel}>
      <View style={styles.head}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{props.title}</Text>
          <Text style={styles.area}>{props.areaLabel}</Text>
        </View>

        <View style={styles.search}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            value={props.query}
            onChangeText={props.onQueryChange}
            placeholder="화장실 이름 또는 주소 검색"
            placeholderTextColor={colors.mutedText}
            accessibilityLabel="화장실 이름 또는 주소 검색"
            style={styles.searchInput}
          />
          {props.query !== '' && (
            <Pressable
              onPress={() => props.onQueryChange('')}
              accessibilityRole="button"
              accessibilityLabel="검색어 지우기"
              hitSlop={8}
            >
              <Text style={styles.clear}>×</Text>
            </Pressable>
          )}
        </View>

        <Pressable
          onPress={props.onLocate}
          disabled={props.locating}
          accessibilityRole="button"
          style={[styles.locate, props.locating && styles.locateBusy]}
        >
          <Text style={styles.locateText}>
            {props.locating ? '위치를 찾는 중…' : '◎ 현재 위치로 찾기'}
          </Text>
        </Pressable>
        {props.notice ? <Text style={styles.notice}>{props.notice}</Text> : null}

        <View style={styles.chips}>
          <Chip
            label="전체"
            selected={noFilter}
            onPress={() =>
              onFilterChange({ accessibleOnly: false, diaperTableOnly: false, availableOnly: false })
            }
          />
          <Chip
            label="장애인 이용 가능"
            selected={filter.accessibleOnly}
            onPress={() => onFilterChange({ accessibleOnly: !filter.accessibleOnly })}
          />
          <Chip
            label="기저귀 교환대"
            selected={filter.diaperTableOnly}
            onPress={() => onFilterChange({ diaperTableOnly: !filter.diaperTableOnly })}
          />
          <Chip
            label="이용 가능"
            selected={filter.availableOnly}
            onPress={() => onFilterChange({ availableOnly: !filter.availableOnly })}
          />
        </View>

        <View style={styles.countRow}>
          <Text style={styles.count}>
            주변 화장실 <Text style={styles.countNumber}>{toilets.length}곳</Text>
          </Text>
          <Text style={styles.sort}>가까운 순 · 이용 가능 우선</Text>
        </View>
      </View>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {loading && toilets.length === 0 ? (
          <Text style={styles.state}>주변 화장실을 찾는 중이에요…</Text>
        ) : error && toilets.length === 0 ? (
          <View style={styles.stateBox}>
            <Text style={[styles.state, { color: colors.danger }]}>{error}</Text>
            <Chip label="다시 시도" onPress={props.onRetry} />
          </View>
        ) : toilets.length === 0 ? (
          <Text style={styles.state}>{props.emptyMessage}</Text>
        ) : (
          toilets.map((toilet, index) => (
            <ToiletCard
              key={toilet.id}
              toilet={toilet}
              number={index + 1}
              now={props.now}
              selected={toilet.id === props.selectedId}
              onPress={() => props.onSelect(toilet.id)}
            />
          ))
        )}
      </ScrollView>

      <Text style={styles.footer}>방문 전 운영시간과 출입 정보를 확인해 주세요.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { flex: 1, backgroundColor: colors.surface },
  head: { paddingHorizontal: spacing.xl, paddingTop: spacing.xl, gap: spacing.md },
  titleRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  area: { fontSize: 13, color: colors.subText },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    height: 44,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  searchIcon: { fontSize: 14 },
  searchInput: { flex: 1, fontSize: 15, color: colors.text, outlineStyle: 'none' } as object,
  clear: { fontSize: 22, color: colors.subText, lineHeight: 22 },
  locate: {
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locateBusy: { opacity: 0.6 },
  locateText: { fontSize: 14, fontWeight: '600', color: colors.text },
  notice: { fontSize: 12, color: colors.orange, lineHeight: 18 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  countRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.xs,
  },
  count: { fontSize: 15, fontWeight: '700', color: colors.text },
  countNumber: { color: colors.primary },
  sort: { fontSize: 12, color: colors.subText },
  list: { flex: 1, marginTop: spacing.sm },
  listContent: { paddingHorizontal: spacing.md, paddingBottom: spacing.md },
  state: { padding: spacing.xl, fontSize: 14, color: colors.subText, textAlign: 'center' },
  stateBox: { alignItems: 'center', gap: spacing.md },
  footer: {
    padding: spacing.lg,
    fontSize: 12,
    color: colors.subText,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});

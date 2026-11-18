import { FlatList, StyleSheet, Text, View } from 'react-native';
import Chip from '../components/Chip';
import FilterBar from '../components/FilterBar';
import StateView from '../components/StateView';
import ToiletCard from '../components/ToiletCard';
import { useNearbyToilets } from '../hooks/useNearbyToilets';
import type { TabProps } from '../navigation/types';
import { colors, spacing } from '../theme';

export default function ListScreen({ navigation }: TabProps<'List'>) {
  const { center, toilets, visibleToilets, filter, setFilter, loading, error, refresh, now } =
    useNearbyToilets();

  if (!center || (loading && toilets.length === 0)) {
    return <StateView kind="loading" message="주변 화장실을 찾는 중이에요…" />;
  }
  if (error && toilets.length === 0) {
    return <StateView kind="error" message={error} onRetry={() => void refresh()} />;
  }

  const emptyMessage =
    toilets.length === 0
      ? '주변 1km 안에 등록된 화장실이 없어요.'
      : '조건에 맞는 화장실이 없어요. 필터를 해제해 보세요.';

  return (
    <View style={styles.container}>
      <FilterBar filter={filter} onChange={setFilter} />
      <View style={styles.refreshRow}>
        <Chip label="↻ 내 위치에서 다시 찾기" onPress={() => void refresh()} />
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
      <FlatList
        data={visibleToilets}
        keyExtractor={(toilet) => toilet.id}
        renderItem={({ item }) => (
          <ToiletCard
            toilet={item}
            now={now}
            onPress={() => navigation.navigate('Detail', { toiletId: item.id })}
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={<StateView kind="empty" message={emptyMessage} />}
        contentContainerStyle={visibleToilets.length === 0 ? styles.emptyContent : styles.content}
        refreshing={loading}
        onRefresh={() => void refresh()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  refreshRow: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm, alignItems: 'flex-start' },
  content: { padding: spacing.lg },
  emptyContent: { flexGrow: 1 },
  separator: { height: spacing.md },
  error: { color: colors.danger, fontSize: 13, paddingHorizontal: spacing.lg },
});

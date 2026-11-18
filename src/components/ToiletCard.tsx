import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  HYGIENE_LABEL,
  PAPER_LABEL,
  formatDistance,
  getAccessStatus,
} from '../services/toiletLogic';
import { colors, radius, spacing } from '../theme';
import type { Toilet } from '../types/toilet';
import OpenBadge from './OpenBadge';

interface Props {
  toilet: Toilet;
  now: Date;
  onPress: () => void;
}

/** 목록과 지도 하단 미리보기에서 함께 쓰는 요약 카드 */
export default function ToiletCard({ toilet, now, onPress }: Props) {
  const status = getAccessStatus(toilet, now);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${toilet.name} 상세 보기`}
      style={styles.card}
    >
      <View style={styles.header}>
        <Text style={styles.name} numberOfLines={1}>
          {toilet.name}
        </Text>
        <Text style={styles.distance}>{formatDistance(toilet.distanceM)}</Text>
      </View>

      <View style={styles.row}>
        <OpenBadge status={status} />
        <Text style={styles.sub}>{toilet.openTime || '개방시간 정보 없음'}</Text>
      </View>

      <Text style={styles.sub}>
        {HYGIENE_LABEL[toilet.hygiene]} · {PAPER_LABEL[toilet.toiletPaper]}
      </Text>

      {(toilet.hasAccessible || toilet.hasDiaperTable || toilet.isUnisex) && (
        <View style={styles.row}>
          {toilet.hasAccessible && <Text style={styles.tag}>♿ 장애인 화장실</Text>}
          {toilet.hasDiaperTable && <Text style={styles.tag}>🍼 기저귀 교환대</Text>}
          {toilet.isUnisex && <Text style={styles.tag}>🚻 남녀 공용</Text>}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { flex: 1, fontSize: 17, fontWeight: '700', color: colors.text },
  distance: { fontSize: 14, color: colors.primary, fontWeight: '600', marginLeft: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  sub: { fontSize: 13, color: colors.subText },
  tag: {
    fontSize: 12,
    color: colors.text,
    backgroundColor: colors.chipBg,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
});

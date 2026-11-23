import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  formatDistance,
  getDisplayStatus,
  walkMinutes,
} from '../services/toiletLogic';
import { colors, radius, spacing } from '../theme';
import type { Toilet } from '../types/toilet';
import StatusBadge from './StatusBadge';

interface Props {
  toilet: Toilet;
  number: number;
  now: Date;
  selected: boolean;
  onPress: () => void;
}

/** 목록의 화장실 카드. 번호는 지도 마커의 번호와 같다. */
export default function ToiletCard({ toilet, number, now, selected, onPress }: Props) {
  const status = getDisplayStatus(toilet, now);
  const note =
    (status === 'MAINTENANCE' || status === 'SUSPENDED') && toilet.statusNote
      ? toilet.statusNote
      : toilet.openTime || '운영시간 정보 없음';
  const photo = toilet.photoUrls[0];

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${number}번 ${toilet.name} 상세 보기`}
      accessibilityState={{ selected }}
      style={[styles.card, selected && styles.selected]}
    >
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {toilet.name}
        </Text>
        <View style={styles.row}>
          <StatusBadge status={status} />
          <Text style={styles.distance}>{formatDistance(toilet.distanceM)}</Text>
          <Text style={styles.walk}>· 도보 {walkMinutes(toilet.distanceM)}분</Text>
        </View>
        <Text style={styles.note} numberOfLines={1}>
          {note}
        </Text>
      </View>

      <View style={styles.thumb}>
        {photo ? (
          <Image source={{ uri: photo }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : (
          <Text style={styles.thumbIcon}>🚻</Text>
        )}
        <View style={styles.numberBadge}>
          <Text style={styles.numberText}>{number}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'transparent',
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  selected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  info: { flex: 1, gap: 6 },
  name: { fontSize: 16, fontWeight: '700', color: colors.text },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  distance: { fontSize: 14, fontWeight: '700', color: colors.text },
  walk: { fontSize: 13, color: colors.subText },
  note: { fontSize: 13, color: colors.subText },
  thumb: {
    width: 84,
    height: 64,
    borderRadius: radius.sm,
    backgroundColor: colors.graySoft,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thumbIcon: { fontSize: 26 },
  numberBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    minWidth: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  numberText: { color: '#fff', fontSize: 11, fontWeight: '800' },
});

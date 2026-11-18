import { StyleSheet, Text, View } from 'react-native';
import { OPEN_STATUS_LABEL } from '../services/toiletLogic';
import { colors, radius, spacing } from '../theme';
import type { OpenStatus } from '../types/toilet';

export const STATUS_COLOR: Record<OpenStatus, string> = {
  OPEN: colors.open,
  CLOSED: colors.closed,
  LOCKED: colors.locked,
  UNKNOWN: colors.unknown,
};

/** 개방 여부를 색과 글자로 함께 보여 주는 배지 (색만으로 구분하지 않는다) */
export default function OpenBadge({ status }: { status: OpenStatus }) {
  return (
    <View style={[styles.badge, { backgroundColor: STATUS_COLOR[status] }]}>
      <Text style={styles.text}>{OPEN_STATUS_LABEL[status]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  text: { color: colors.primaryText, fontSize: 12, fontWeight: '700' },
});

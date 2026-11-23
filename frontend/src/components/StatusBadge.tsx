import { StyleSheet, Text, View } from 'react-native';
import { STATUS_LABEL, type DisplayStatus } from '../services/toiletLogic';
import { colors, radius, spacing } from '../theme';

const BADGE_COLORS: Record<DisplayStatus, { bg: string; fg: string }> = {
  AVAILABLE: { bg: colors.greenSoft, fg: colors.green },
  MAINTENANCE: { bg: colors.orangeSoft, fg: colors.orange },
  SUSPENDED: { bg: colors.graySoft, fg: colors.gray },
  CLOSED_NOW: { bg: colors.graySoft, fg: colors.gray },
  UNKNOWN: { bg: colors.graySoft, fg: colors.gray },
};

/** 지도 마커 색 */
export const MARKER_COLOR: Record<DisplayStatus, string> = {
  AVAILABLE: colors.green,
  MAINTENANCE: colors.orangeMarker,
  SUSPENDED: colors.gray,
  CLOSED_NOW: colors.gray,
  UNKNOWN: colors.gray,
};

/** 운영 상태를 색과 글자로 함께 보여 주는 배지 (색만으로 구분하지 않는다) */
export default function StatusBadge({ status }: { status: DisplayStatus }) {
  const c = BADGE_COLORS[status];
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <Text style={[styles.text, { color: c.fg }]}>{STATUS_LABEL[status]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
    alignSelf: 'flex-start',
  },
  text: { fontSize: 12, fontWeight: '700' },
});

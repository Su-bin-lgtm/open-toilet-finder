import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, radius, spacing } from '../theme';

interface Props {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}

/** 필터·선택지에 쓰는 알약 모양 버튼 */
export default function Chip({ label, selected = false, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[styles.chip, selected && styles.selected]}
    >
      <Text style={[styles.label, selected && styles.selectedLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selected: { backgroundColor: colors.primary, borderColor: colors.primary },
  label: { fontSize: 14, color: colors.text },
  selectedLabel: { color: colors.primaryText, fontWeight: '600' },
});

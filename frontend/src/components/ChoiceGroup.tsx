import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../theme';

export interface ChoiceOption<T extends string> {
  value: T;
  label: string;
}

interface Props<T extends string> {
  label: string;
  /** 라벨 아래 보조 설명 */
  hint?: string;
  required?: boolean;
  options: ChoiceOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
}

/**
 * 선택 방식 입력 (UI-07, UI-04): 글자를 입력하지 않고 큰 버튼 하나만 누르게 한다.
 * 급한 상황에서도 누르기 쉽도록 버튼 높이를 48px 로 잡았다.
 */
export default function ChoiceGroup<T extends string>({
  label,
  hint,
  required = false,
  options,
  value,
  onChange,
}: Props<T>) {
  return (
    <View style={styles.group} accessibilityRole="radiogroup" accessibilityLabel={label}>
      <Text style={styles.label}>
        {label}
        {required ? <Text style={styles.required}> *</Text> : null}
      </Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      <View style={styles.options}>
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <Pressable
              key={option.value}
              onPress={() => onChange(option.value)}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              style={[styles.option, selected && styles.optionSelected]}
            >
              <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                {selected ? '✓ ' : ''}
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: spacing.sm },
  label: { fontSize: 16, fontWeight: '700', color: colors.text },
  required: { color: colors.danger },
  hint: { fontSize: 13, color: colors.subText, lineHeight: 19 },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  option: {
    minHeight: 48,
    minWidth: 96,
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionSelected: { backgroundColor: colors.primarySoft, borderColor: colors.primary, borderWidth: 2 },
  optionText: { fontSize: 15, color: colors.text },
  optionTextSelected: { color: colors.primary, fontWeight: '700' },
});

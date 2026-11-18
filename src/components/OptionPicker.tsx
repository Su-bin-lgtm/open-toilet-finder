import { StyleSheet, View } from 'react-native';
import { spacing } from '../theme';
import Chip from './Chip';

export interface Option<T extends string> {
  value: T;
  label: string;
}

interface Props<T extends string> {
  options: Option<T>[];
  value: T | null;
  onChange: (value: T) => void;
}

/** 여러 선택지 중 하나를 고르는 입력 (제보 화면에서 사용) */
export default function OptionPicker<T extends string>({
  options,
  value,
  onChange,
}: Props<T>) {
  return (
    <View style={styles.row}>
      {options.map((option) => (
        <Chip
          key={option.value}
          label={option.label}
          selected={option.value === value}
          onPress={() => onChange(option.value)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});

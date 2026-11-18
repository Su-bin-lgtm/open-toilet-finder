import { StyleSheet, View } from 'react-native';
import { spacing } from '../theme';
import type { ToiletFilter } from '../types/toilet';
import Chip from './Chip';

interface Props {
  filter: ToiletFilter;
  onChange: (patch: Partial<ToiletFilter>) => void;
}

/**
 * 지금 이용 가능 / 장애인 화장실 / 기저귀 교환대 / 남녀 공용 필터.
 * 좁은 화면에서도 모든 버튼이 한눈에 보이도록 가로 스크롤 대신 줄바꿈으로 배치한다.
 */
export default function FilterBar({ filter, onChange }: Props) {
  return (
    <View style={styles.row}>
      <Chip
        label="지금 이용 가능"
        selected={filter.openNowOnly}
        onPress={() => onChange({ openNowOnly: !filter.openNowOnly })}
      />
      <Chip
        label="♿ 장애인 화장실"
        selected={filter.accessibleOnly}
        onPress={() => onChange({ accessibleOnly: !filter.accessibleOnly })}
      />
      <Chip
        label="🍼 기저귀 교환대"
        selected={filter.diaperTableOnly}
        onPress={() => onChange({ diaperTableOnly: !filter.diaperTableOnly })}
      />
      <Chip
        label="🚻 남녀 공용"
        selected={filter.unisexOnly}
        onPress={() => onChange({ unisexOnly: !filter.unisexOnly })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
});

import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { MAP_APPS, type MapAppId } from '../services/mapLink';
import { colors, radius, spacing } from '../theme';

interface Props {
  visible: boolean;
  onSelect: (app: MapAppId) => void;
  onClose: () => void;
}

/**
 * 길찾기에 쓸 지도 앱을 고르는 하단 시트.
 * Alert 는 안드로이드에서 버튼이 3개까지만 보여서 Modal 로 직접 만들었다.
 */
export default function DirectionsSheet({ visible, onSelect, onClose }: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="닫기" />
      <View style={styles.sheet}>
        <Text style={styles.title}>어떤 지도 앱으로 길찾기할까요?</Text>
        {MAP_APPS.map((app) => (
          <Pressable
            key={app.id}
            onPress={() => onSelect(app.id)}
            accessibilityRole="button"
            style={styles.item}
          >
            <Text style={styles.itemText}>{app.label}</Text>
          </Pressable>
        ))}
        <Pressable onPress={onClose} accessibilityRole="button" style={styles.item}>
          <Text style={[styles.itemText, styles.cancel]}>취소</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.4)' },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.md,
    borderTopRightRadius: radius.md,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  title: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  item: { paddingVertical: spacing.md, alignItems: 'center' },
  itemText: { fontSize: 16, color: colors.text },
  cancel: { color: colors.subText },
});

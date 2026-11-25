import { Pressable, StyleSheet, Text, View } from 'react-native';
import { navigate } from '../navigation/routes';
import { colors, radius, spacing } from '../theme';

/** 아직 만들지 않은 화면의 자리. (내 제보 등) */
export default function ComingSoonScreen({ title, known }: { title: string; known: boolean }) {
  return (
    <View style={styles.root}>
      <View style={styles.card}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.body}>
          {known
            ? '이 화면은 아직 준비 중이에요. 로그인 없이 쓰는 지금 방식에서는 내 제보를 구분할 기준이 없어, 사용자 식별 방식이 정해지면 만듭니다.'
            : '주소를 확인해 주세요. 없는 화면이에요.'}
        </Text>
        <Pressable onPress={() => navigate('/')} accessibilityRole="button" style={styles.button}>
          <Text style={styles.buttonText}>주변 화장실로 돌아가기</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  card: {
    maxWidth: 480,
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    gap: spacing.md,
    alignItems: 'center',
  },
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  body: { fontSize: 14, color: colors.subText, textAlign: 'center', lineHeight: 22 },
  button: {
    marginTop: spacing.sm,
    height: 44,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});

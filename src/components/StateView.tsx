import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../theme';
import PrimaryButton from './PrimaryButton';

interface Props {
  kind: 'loading' | 'error' | 'empty';
  message?: string;
  onRetry?: () => void;
}

/** 로딩 / 오류 / 결과 없음 화면을 한 컴포넌트로 통일 */
export default function StateView({ kind, message, onRetry }: Props) {
  return (
    <View style={styles.container}>
      {kind === 'loading' && <ActivityIndicator size="large" color={colors.primary} />}
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {kind !== 'loading' && onRetry ? (
        <PrimaryButton label="다시 시도" onPress={onRetry} variant="secondary" />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  message: { fontSize: 15, color: colors.subText, textAlign: 'center' },
});

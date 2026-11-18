import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
} from 'react-native';
import OptionPicker, { type Option } from '../components/OptionPicker';
import PrimaryButton from '../components/PrimaryButton';
import { useNearbyToilets } from '../hooks/useNearbyToilets';
import type { RootStackProps } from '../navigation/types';
import { submitErrorReport } from '../services/api';
import { notify } from '../services/notify';
import { colors, radius, spacing } from '../theme';
import type { ErrorReason } from '../types/toilet';

const REASON_OPTIONS: Option<ErrorReason>[] = [
  { value: 'WRONG_LOCATION', label: '위치가 달라요' },
  { value: 'CLOSED_PERMANENTLY', label: '없어졌거나 폐쇄됐어요' },
  { value: 'WRONG_INFO', label: '시간·시설 정보가 달라요' },
  { value: 'NOT_TOILET', label: '개방화장실이 아니에요' },
  { value: 'OTHER', label: '기타' },
];

export default function ErrorReportScreen({ route, navigation }: RootStackProps<'ErrorReport'>) {
  const { toiletId } = route.params;
  const { getToilet } = useNearbyToilets();
  const toilet = getToilet(toiletId);

  const [reason, setReason] = useState<ErrorReason | null>(null);
  const [detail, setDetail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // "기타"를 고르면 무엇이 문제인지 알 수 없으므로 설명을 필수로 한다.
  const needsDetail = reason === 'OTHER';
  const canSubmit =
    reason !== null && (!needsDetail || detail.trim().length > 0) && !submitting;

  const handleSubmit = async () => {
    if (reason === null || submitting) return;
    setSubmitting(true);
    try {
      await submitErrorReport(toiletId, { reason, detail: detail.trim() || undefined });
      notify('신고 완료', '확인 후 정보를 바로잡을게요. 감사합니다.', () => navigation.goBack());
    } catch (e) {
      notify('신고에 실패했어요', e instanceof Error ? e.message : '잠시 후 다시 시도해 주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>{toilet?.name ?? '화장실'}</Text>

        <Text style={styles.label}>어떤 점이 잘못됐나요? (필수)</Text>
        <OptionPicker options={REASON_OPTIONS} value={reason} onChange={setReason} />

        <Text style={styles.label}>{needsDetail ? '자세한 내용 (필수)' : '자세한 내용 (선택)'}</Text>
        <TextInput
          value={detail}
          onChangeText={setDetail}
          placeholder="어떻게 다른지 알려 주세요"
          maxLength={300}
          multiline
          style={styles.input}
        />

        <PrimaryButton
          label="신고하기"
          variant="danger"
          onPress={() => void handleSubmit()}
          disabled={!canSubmit}
          loading={submitting}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.md },
  title: { fontSize: 20, fontWeight: '800', color: colors.text },
  label: { fontSize: 14, fontWeight: '700', color: colors.text, marginTop: spacing.sm },
  input: {
    minHeight: 100,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    backgroundColor: colors.card,
    padding: spacing.md,
    fontSize: 15,
    color: colors.text,
    textAlignVertical: 'top',
  },
});

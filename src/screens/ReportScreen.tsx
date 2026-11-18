import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import OptionPicker, { type Option } from '../components/OptionPicker';
import PrimaryButton from '../components/PrimaryButton';
import { useNearbyToilets } from '../hooks/useNearbyToilets';
import type { RootStackProps } from '../navigation/types';
import { submitReport } from '../services/api';
import { notify } from '../services/notify';
import { colors, radius, spacing } from '../theme';
import type { ReportPayload } from '../types/toilet';

type Hygiene = ReportPayload['hygiene'];
type Paper = ReportPayload['toiletPaper'];
type Door = 'OPEN' | 'LOCKED';

const HYGIENE_OPTIONS: Option<Hygiene>[] = [
  { value: 'GOOD', label: '깨끗해요' },
  { value: 'NORMAL', label: '보통이에요' },
  { value: 'BAD', label: '더러워요' },
];
const PAPER_OPTIONS: Option<Paper>[] = [
  { value: 'YES', label: '휴지 있음' },
  { value: 'NO', label: '휴지 없음' },
];
const DOOR_OPTIONS: Option<Door>[] = [
  { value: 'OPEN', label: '열려 있어요' },
  { value: 'LOCKED', label: '잠겨 있어요' },
];

export default function ReportScreen({ route, navigation }: RootStackProps<'Report'>) {
  const { toiletId } = route.params;
  const { getToilet, upsertToilet } = useNearbyToilets();
  const toilet = getToilet(toiletId);

  const [hygiene, setHygiene] = useState<Hygiene | null>(null);
  const [paper, setPaper] = useState<Paper | null>(null);
  const [door, setDoor] = useState<Door>('OPEN');
  const [code, setCode] = useState('');
  const [memo, setMemo] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = hygiene !== null && paper !== null && !submitting;

  const handleSubmit = async () => {
    if (hygiene === null || paper === null || submitting) return;
    setSubmitting(true);
    try {
      const payload: ReportPayload = {
        hygiene,
        toiletPaper: paper,
        isLocked: door === 'LOCKED',
        doorLockCode: code.trim() || undefined,
        memo: memo.trim() || undefined,
      };
      const updated = await submitReport(toiletId, payload);
      upsertToilet(updated); // 서버가 돌려준 최신 정보를 바로 화면에 반영
      notify('제보 완료', '소중한 제보 감사합니다. 최신 정보에 반영했어요.', () => navigation.goBack());
    } catch (e) {
      notify('제보에 실패했어요', e instanceof Error ? e.message : '잠시 후 다시 시도해 주세요.');
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

        <Text style={styles.label}>위생 상태 (필수)</Text>
        <OptionPicker options={HYGIENE_OPTIONS} value={hygiene} onChange={setHygiene} />

        <Text style={styles.label}>휴지 (필수)</Text>
        <OptionPicker options={PAPER_OPTIONS} value={paper} onChange={setPaper} />

        <Text style={styles.label}>문 상태</Text>
        <OptionPicker options={DOOR_OPTIONS} value={door} onChange={setDoor} />

        <Text style={styles.label}>도어락 번호 (선택)</Text>
        <TextInput
          value={code}
          onChangeText={setCode}
          placeholder="알고 있다면 입력해 주세요"
          maxLength={20}
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.input}
        />

        <Text style={styles.label}>메모 (선택)</Text>
        <TextInput
          value={memo}
          onChangeText={setMemo}
          placeholder="예: 2층 복도 끝에 있어요"
          maxLength={200}
          multiline
          style={[styles.input, styles.memo]}
        />
        <Text style={styles.count}>{memo.length}/200</Text>

        <View style={styles.submit}>
          <PrimaryButton
            label="제보하기"
            onPress={() => void handleSubmit()}
            disabled={!canSubmit}
            loading={submitting}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.sm },
  title: { fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: spacing.sm },
  label: { fontSize: 14, fontWeight: '700', color: colors.text, marginTop: spacing.md },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 15,
    color: colors.text,
  },
  memo: { minHeight: 88, textAlignVertical: 'top' },
  count: { alignSelf: 'flex-end', fontSize: 12, color: colors.subText },
  submit: { marginTop: spacing.lg },
});

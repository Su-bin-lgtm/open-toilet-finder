// 정보 오류 신고 창 (FE-13). 상세 화면에서 잘못된 정보를 신고한다.
// 도어락 정보를 지워 달라는 관리 주체의 요청(UI-11, BE-17)도 같은 신고 창으로 받는다.
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { postErrorReport } from '../services/api';
import { colors, radius, spacing } from '../theme';
import type { ErrorReportReason, Toilet } from '../types/toilet';

const DESCRIPTION_MAX = 200;

const REASONS: { value: ErrorReportReason; label: string }[] = [
  { value: 'WRONG_LOCATION', label: '위치가 달라요' },
  { value: 'WRONG_HOURS', label: '운영시간이 달라요' },
  { value: 'CLOSED_OR_REMOVED', label: '없어졌거나 폐쇄됐어요' },
  { value: 'WRONG_FACILITY', label: '편의시설 정보가 달라요 (장애인 화장실·기저귀 교환대 등)' },
  { value: 'DOORLOCK_REMOVAL', label: '도어락 정보를 삭제해 주세요 (관리 주체)' },
  { value: 'OTHER', label: '기타' },
];

interface Props {
  toilet: Toilet;
  /** 처음에 선택해 둘 사유. 도어락 삭제 요청 버튼에서 열 때 사용 */
  initialReason?: ErrorReportReason;
  onClose: () => void;
}

export default function ErrorReportModal({ toilet, initialReason, onClose }: Props) {
  const [reason, setReason] = useState<ErrorReportReason | null>(initialReason ?? null);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const canSubmit = reason !== null && !submitting;

  const submit = async () => {
    if (reason === null || submitting) return; // 중복 전송 방지
    setSubmitting(true);
    setError(null);
    try {
      await postErrorReport(toilet.id, { reason, description: description.trim() || undefined });
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : '신고를 보내지 못했어요. 다시 시도해 주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal transparent animationType="fade" onRequestClose={onClose} visible>
      <View style={styles.backdrop}>
        <View style={styles.dialog} accessibilityViewIsModal>
          {done ? (
            <View style={styles.body}>
              <Text style={styles.title}>신고가 접수됐어요</Text>
              <Text style={styles.lead}>
                알려 주셔서 고마워요. 확인해서 정보에 반영할게요.
              </Text>
              <Pressable onPress={onClose} accessibilityRole="button" style={styles.primaryBtn}>
                <Text style={styles.primaryBtnText}>확인</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <ScrollView contentContainerStyle={styles.body}>
                <Text style={styles.title}>정보 오류 신고</Text>
                <Text style={styles.lead}>{toilet.name}</Text>

                <View style={styles.reasons} accessibilityRole="radiogroup">
                  {REASONS.map((r) => {
                    const selected = r.value === reason;
                    return (
                      <Pressable
                        key={r.value}
                        onPress={() => setReason(r.value)}
                        accessibilityRole="radio"
                        accessibilityState={{ checked: selected }}
                        style={[styles.reason, selected && styles.reasonSelected]}
                      >
                        <Text style={[styles.reasonText, selected && styles.reasonTextSelected]}>
                          {selected ? '✓ ' : ''}
                          {r.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                {reason === 'DOORLOCK_REMOVAL' ? (
                  <Text style={styles.hint}>
                    화장실을 관리하는 분의 요청이면 도어락 정보를 삭제해 드려요. 관리 주체임을 알 수
                    있도록 소속을 아래 설명에 적어 주세요.
                  </Text>
                ) : null}

                <View style={{ gap: spacing.xs }}>
                  <Text style={styles.label}>자세한 설명 (선택)</Text>
                  <TextInput
                    value={description}
                    onChangeText={(text) => setDescription(text.slice(0, DESCRIPTION_MAX))}
                    placeholder="어떤 점이 다른지 적어 주시면 확인에 도움이 돼요"
                    placeholderTextColor={colors.mutedText}
                    accessibilityLabel="자세한 설명"
                    multiline
                    maxLength={DESCRIPTION_MAX}
                    style={styles.input}
                  />
                  <Text style={styles.counter}>
                    {description.length} / {DESCRIPTION_MAX}
                  </Text>
                </View>

                {error ? (
                  <Text style={styles.error} accessibilityRole="alert">
                    {error}
                  </Text>
                ) : null}
              </ScrollView>

              <View style={styles.actions}>
                <Pressable
                  onPress={onClose}
                  disabled={submitting}
                  accessibilityRole="button"
                  style={[styles.btn, styles.cancelBtn]}
                >
                  <Text style={styles.cancelText}>취소</Text>
                </Pressable>
                <Pressable
                  onPress={() => void submit()}
                  disabled={!canSubmit}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: !canSubmit }}
                  style={[styles.btn, styles.primaryBtnFlex, !canSubmit && styles.btnDisabled]}
                >
                  <Text style={styles.primaryBtnText}>{submitting ? '보내는 중…' : '신고 보내기'}</Text>
                </Pressable>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(17,24,39,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  dialog: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '92%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  body: { padding: spacing.xl, gap: spacing.lg },
  title: { fontSize: 20, fontWeight: '800', color: colors.text },
  lead: { fontSize: 14, color: colors.subText, lineHeight: 21 },
  reasons: { gap: spacing.sm },
  reason: {
    minHeight: 48,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
  },
  reasonSelected: { backgroundColor: colors.primarySoft, borderColor: colors.primary, borderWidth: 2 },
  reasonText: { fontSize: 14, color: colors.text, lineHeight: 20 },
  reasonTextSelected: { color: colors.primary, fontWeight: '700' },
  hint: {
    fontSize: 13,
    color: colors.orange,
    backgroundColor: colors.orangeSoft,
    padding: spacing.md,
    borderRadius: radius.sm,
    lineHeight: 19,
  },
  label: { fontSize: 14, fontWeight: '700', color: colors.text },
  input: {
    minHeight: 88,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 14,
    color: colors.text,
    textAlignVertical: 'top',
  },
  counter: { fontSize: 12, color: colors.mutedText, textAlign: 'right' },
  error: {
    fontSize: 14,
    color: colors.danger,
    backgroundColor: '#FEF2F2',
    padding: spacing.md,
    borderRadius: radius.sm,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  btn: { height: 48, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  cancelText: { fontSize: 15, fontWeight: '600', color: colors.text },
  primaryBtn: {
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnFlex: { flex: 2, backgroundColor: colors.primary },
  primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  btnDisabled: { backgroundColor: colors.mutedText },
});

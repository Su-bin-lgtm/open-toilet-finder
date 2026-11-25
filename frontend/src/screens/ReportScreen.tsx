// 사용자 제보 화면 (FE-12, UI-07): 선택 방식 위주로 입력하고 서버로 보낸다.
//   /#/report            → 제보할 화장실을 고르는 목록
//   /#/report?id=화장실ID → 해당 화장실의 제보 입력
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import ChoiceGroup from '../components/ChoiceGroup';
import StatusBadge from '../components/StatusBadge';
import { useNearbyToilets } from '../hooks/useNearbyToilets';
import { navigate, routeWith } from '../navigation/routes';
import { fetchToiletDetail, postReport } from '../services/api';
import {
  formatDateTime,
  formatDistance,
  getDisplayStatus,
} from '../services/toiletLogic';
import { colors, radius, spacing } from '../theme';
import type {
  HygieneLevel,
  PaperStatus,
  PasscodeStatus,
  ReportRequest,
  Toilet,
  ToiletStatus,
} from '../types/toilet';

const COMMENT_MAX = 100;

const STATUS_OPTIONS: { value: ToiletStatus; label: string }[] = [
  { value: 'AVAILABLE', label: '이용 가능' },
  { value: 'MAINTENANCE', label: '점검 중' },
  { value: 'SUSPENDED', label: '운영 중지' },
];
const PASSCODE_OPTIONS: { value: PasscodeStatus; label: string }[] = [
  { value: 'NOT_REQUIRED', label: '필요 없음' },
  { value: 'REQUIRED', label: '필요함' },
  { value: 'UNKNOWN', label: '모르겠어요' },
];
const PAPER_OPTIONS: { value: PaperStatus; label: string }[] = [
  { value: 'PROVIDED', label: '있음' },
  { value: 'NONE', label: '없음' },
  { value: 'UNKNOWN', label: '모르겠어요' },
];
const HYGIENE_OPTIONS: { value: HygieneLevel | 'UNKNOWN'; label: string }[] = [
  { value: 'CLEAN', label: '깨끗해요' },
  { value: 'NORMAL', label: '보통이에요' },
  { value: 'DIRTY', label: '더러워요' },
  { value: 'UNKNOWN', label: '모르겠어요' },
];

export default function ReportScreen({ toiletId }: { toiletId?: string }) {
  if (!toiletId) return <PickToilet />;
  return <ReportForm key={toiletId} toiletId={toiletId} />;
}

// ───────── 1단계: 제보할 화장실 고르기 ─────────
function PickToilet() {
  const { toilets, loading, error, retry, now } = useNearbyToilets();
  const sorted = useMemo(
    () => [...toilets].sort((a, b) => (a.distanceM ?? 0) - (b.distanceM ?? 0)),
    [toilets],
  );

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.card}>
        <Text style={styles.title}>어떤 화장실을 제보할까요?</Text>
        <Text style={styles.lead}>가까운 순서예요. 지도나 목록에서 화장실을 고르고 ‘제보하기’를 눌러도 됩니다.</Text>

        {loading && sorted.length === 0 ? (
          <Text style={styles.state}>주변 화장실을 찾는 중이에요…</Text>
        ) : error && sorted.length === 0 ? (
          <View style={styles.stateBox}>
            <Text style={[styles.state, { color: colors.danger }]}>{error}</Text>
            <Pressable onPress={() => void retry()} accessibilityRole="button" style={styles.secondaryBtn}>
              <Text style={styles.secondaryBtnText}>다시 시도</Text>
            </Pressable>
          </View>
        ) : sorted.length === 0 ? (
          <Text style={styles.state}>주변에 제보할 수 있는 화장실이 없어요.</Text>
        ) : (
          <View style={styles.pickList}>
            {sorted.map((t) => (
              <Pressable
                key={t.id}
                onPress={() => navigate(routeWith('/report', { id: t.id }))}
                accessibilityRole="button"
                accessibilityLabel={`${t.name} 제보하기`}
                style={styles.pickItem}
              >
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={styles.pickName}>{t.name}</Text>
                  <View style={styles.pickMeta}>
                    <StatusBadge status={getDisplayStatus(t, now)} />
                    <Text style={styles.sub}>{formatDistance(t.distanceM)}</Text>
                  </View>
                </View>
                <Text style={styles.chevron}>›</Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

// ───────── 2단계: 제보 입력과 전송 ─────────
function ReportForm({ toiletId }: { toiletId: string }) {
  const { getToilet, loading, upsertToilet } = useNearbyToilets();
  const fromList = getToilet(toiletId);
  const [fetched, setFetched] = useState<Toilet | null>(null);
  const [lookupFailed, setLookupFailed] = useState(false);
  const toilet = fromList ?? fetched;

  // 새로고침 등으로 목록에 없으면, 목록 조회가 끝난 뒤 상세 조회로 찾아 본다.
  useEffect(() => {
    if (fromList || loading) return;
    let cancelled = false;
    fetchToiletDetail(toiletId)
      .then((t) => !cancelled && setFetched(t))
      .catch(() => !cancelled && setLookupFailed(true));
    return () => {
      cancelled = true;
    };
  }, [fromList, loading, toiletId]);

  const [status, setStatus] = useState<ToiletStatus | null>(null);
  const [passcode, setPasscode] = useState<PasscodeStatus | null>(null);
  const [paper, setPaper] = useState<PaperStatus | null>(null);
  const [hygiene, setHygiene] = useState<HygieneLevel | 'UNKNOWN' | null>(null);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [doneAt, setDoneAt] = useState<string | null>(null);

  if (!toilet) {
    return (
      <View style={styles.center}>
        <Text style={styles.state}>
          {lookupFailed ? '화장실 정보를 찾을 수 없어요.' : '화장실 정보를 불러오는 중이에요…'}
        </Text>
        {lookupFailed ? (
          <Pressable onPress={() => navigate('/report')} accessibilityRole="button" style={styles.secondaryBtn}>
            <Text style={styles.secondaryBtnText}>다른 화장실 고르기</Text>
          </Pressable>
        ) : null}
      </View>
    );
  }

  const canSubmit = status !== null && !submitting;

  const submit = async () => {
    if (status === null || submitting) return; // 중복 전송 방지
    setSubmitting(true);
    setSubmitError(null);
    const body: ReportRequest = {
      status,
      passcode: passcode ?? 'UNKNOWN',
      toiletPaper: paper ?? 'UNKNOWN',
      hygiene: hygiene ?? 'UNKNOWN',
      comment: comment.trim() || undefined,
    };
    try {
      const result = await postReport(toilet.id, body);
      setDoneAt(result.createdAt);
      // 제보가 반영된 최신 정보를 받아 목록·상세에도 바로 보이게 한다. (실패해도 제보 자체는 성공)
      fetchToiletDetail(toilet.id).then(upsertToilet).catch(() => undefined);
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : '제보를 보내지 못했어요. 다시 시도해 주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  if (doneAt) {
    return (
      <ScrollView contentContainerStyle={styles.page}>
        <View style={[styles.card, { alignItems: 'center' }]}>
          <Text style={styles.doneIcon}>✅</Text>
          <Text style={styles.title}>제보해 주셔서 고마워요</Text>
          <Text style={styles.lead}>
            {toilet.name}
            {'\n'}
            {formatDateTime(doneAt)} 에 제보가 등록됐어요.
          </Text>
          <View style={styles.doneActions}>
            <Pressable
              onPress={() => navigate(routeWith('/', { id: toilet.id }))}
              accessibilityRole="button"
              style={styles.primaryBtn}
            >
              <Text style={styles.primaryBtnText}>상세 정보 보기</Text>
            </Pressable>
            <Pressable onPress={() => navigate('/report')} accessibilityRole="button" style={styles.secondaryBtn}>
              <Text style={styles.secondaryBtnText}>다른 화장실 제보하기</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
      <View style={styles.card}>
        <Pressable onPress={() => navigate('/report')} accessibilityRole="link" hitSlop={8}>
          <Text style={styles.back}>‹ 다른 화장실 고르기</Text>
        </Pressable>
        <Text style={styles.title}>{toilet.name}</Text>
        <Text style={styles.lead}>지금 상태를 알려 주세요. 눌러서 고르기만 하면 돼요. (* 필수)</Text>

        <ChoiceGroup
          label="지금 이용할 수 있나요?"
          required
          options={STATUS_OPTIONS}
          value={status}
          onChange={setStatus}
        />
        <ChoiceGroup
          label="도어락(출입 비밀번호)"
          hint="비밀번호가 필요한지만 골라 주세요."
          options={PASSCODE_OPTIONS}
          value={passcode}
          onChange={setPasscode}
        />
        <ChoiceGroup label="화장지" options={PAPER_OPTIONS} value={paper} onChange={setPaper} />
        <ChoiceGroup label="위생 상태" options={HYGIENE_OPTIONS} value={hygiene} onChange={setHygiene} />

        <View style={styles.commentBox}>
          <Text style={styles.groupLabel}>한 줄 메모 (선택)</Text>
          <TextInput
            value={comment}
            onChangeText={(text) => setComment(text.slice(0, COMMENT_MAX))}
            placeholder="예: 2층 화장실만 열려 있어요"
            placeholderTextColor={colors.mutedText}
            accessibilityLabel="한 줄 메모"
            maxLength={COMMENT_MAX}
            style={styles.input}
          />
          <Text style={styles.counter}>
            {comment.length} / {COMMENT_MAX}
          </Text>
        </View>

        {submitError ? (
          <Text style={styles.error} accessibilityRole="alert">
            {submitError}
          </Text>
        ) : null}

        <Pressable
          onPress={() => void submit()}
          disabled={!canSubmit}
          accessibilityRole="button"
          accessibilityState={{ disabled: !canSubmit }}
          style={[styles.primaryBtn, !canSubmit && styles.btnDisabled]}
        >
          <Text style={styles.primaryBtnText}>
            {submitting ? '보내는 중…' : status === null ? '이용 가능 여부를 먼저 골라 주세요' : '제보 보내기'}
          </Text>
        </Pressable>
        <Text style={styles.footnote}>
          같은 기기에서 짧은 시간에 여러 번 보내면 제한될 수 있어요. 허위 제보는 정보를 믿을 수 없게 만들어요.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: spacing.xl, alignItems: 'center' },
  card: {
    width: '100%',
    maxWidth: 640,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    gap: spacing.xl,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xl },
  back: { fontSize: 14, color: colors.primary, fontWeight: '600' },
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  lead: { fontSize: 14, color: colors.subText, lineHeight: 21 },
  sub: { fontSize: 13, color: colors.subText },
  state: { fontSize: 14, color: colors.subText, textAlign: 'center', padding: spacing.lg },
  stateBox: { alignItems: 'center', gap: spacing.md },
  pickList: { gap: spacing.sm },
  pickItem: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 64,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pickName: { fontSize: 16, fontWeight: '700', color: colors.text },
  pickMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  chevron: { fontSize: 24, color: colors.mutedText },
  groupLabel: { fontSize: 16, fontWeight: '700', color: colors.text },
  commentBox: { gap: spacing.sm },
  input: {
    height: 48,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 15,
    color: colors.text,
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
  primaryBtn: {
    minHeight: 52,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  btnDisabled: { backgroundColor: colors.mutedText },
  secondaryBtn: {
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  secondaryBtnText: { color: colors.text, fontSize: 15, fontWeight: '600' },
  footnote: { fontSize: 12, color: colors.subText, lineHeight: 18 },
  doneIcon: { fontSize: 48 },
  doneActions: { width: '100%', gap: spacing.sm },
});

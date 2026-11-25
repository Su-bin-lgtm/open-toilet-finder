import { useEffect, useState, type ReactNode } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNearbyToilets } from '../hooks/useNearbyToilets';
import { navigate, routeWith } from '../navigation/routes';
import { fetchToiletDetail } from '../services/api';
import { openDirections } from '../services/mapLink';
import {
  formatDateTime,
  getClosingLabel,
  getDisplayStatus,
} from '../services/toiletLogic';
import { colors, radius, spacing } from '../theme';
import type { ErrorReportReason, HygieneLevel, PaperStatus, PasscodeStatus, Toilet } from '../types/toilet';
import ErrorReportModal from './ErrorReportModal';
import StatusBadge from './StatusBadge';

interface Props {
  toilet: Toilet | null;
  now: Date;
  /** 좁은 화면에서 지도 위에 겹쳐 보일 때만 닫기 버튼을 보여 준다. */
  onClose?: () => void;
}

const PAPER_TEXT: Record<PaperStatus, string> = {
  PROVIDED: '비치됨',
  NONE: '없음',
  UNKNOWN: '정보 없음',
};
const HYGIENE_TEXT: Record<HygieneLevel | 'UNKNOWN', string> = {
  CLEAN: '깨끗해요',
  NORMAL: '보통이에요',
  DIRTY: '더러워요',
  UNKNOWN: '정보 없음',
};
const PASSCODE_TEXT: Record<PasscodeStatus, string> = {
  NOT_REQUIRED: '필요 없음',
  REQUIRED: '필요',
  UNKNOWN: '정보 없음',
};

/** 오른쪽 패널: 선택한 화장실의 상세 정보 */
export default function ToiletDetailPanel({ toilet, now, onClose }: Props) {
  const { upsertToilet, userLocation } = useNearbyToilets();
  const [refreshFailed, setRefreshFailed] = useState(false);
  // 오류 신고 창 (FE-13). 도어락 삭제 요청 버튼으로 열면 해당 사유를 미리 선택해 둔다.
  const [errorReport, setErrorReport] = useState<{ reason?: ErrorReportReason } | null>(null);

  // 선택할 때마다 서버에서 최신 정보를 받아 목록에도 반영한다. (실패해도 이미 있는 정보는 그대로 보여 준다)
  const toiletId = toilet?.id ?? null;
  useEffect(() => {
    if (!toiletId) return;
    let cancelled = false;
    setRefreshFailed(false);
    fetchToiletDetail(toiletId)
      .then((latest) => {
        if (!cancelled) upsertToilet(latest);
      })
      .catch(() => {
        if (!cancelled) setRefreshFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [toiletId, upsertToilet]);

  if (!toilet) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>목록이나 지도에서 화장실을 선택하면 자세한 정보가 보여요.</Text>
      </View>
    );
  }

  const status = getDisplayStatus(toilet, now);
  const closing = status === 'AVAILABLE' ? getClosingLabel(toilet.openTime, now) : null;
  const photo = toilet.photoUrls[0];

  return (
    <View style={styles.panel}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.photo}>
          {photo ? (
            <>
              <Image source={{ uri: photo }} style={StyleSheet.absoluteFill} resizeMode="cover" />
              <View style={styles.photoCount}>
                <Text style={styles.photoCountText}>1 / {toilet.photoUrls.length}</Text>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.photoIcon}>🚻</Text>
              <Text style={styles.photoNote}>등록된 사진이 없어요</Text>
            </>
          )}
          {onClose ? (
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="상세 닫기"
              style={styles.close}
            >
              <Text style={styles.closeText}>×</Text>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.body}>
          <View style={styles.statusRow}>
            <StatusBadge status={status} />
            {closing ? <Text style={styles.closing}>{closing}</Text> : null}
            {!closing && toilet.statusNote && status !== 'AVAILABLE' ? (
              <Text style={styles.closing}>{toilet.statusNote}</Text>
            ) : null}
          </View>
          <Text style={styles.name}>{toilet.name}</Text>
          <Text style={styles.address}>{toilet.address}</Text>
          {toilet.locationNote ? <Text style={styles.address}>{toilet.locationNote}</Text> : null}

          <Section title="편의시설 및 출입 정보">
            <Row label="장애인 화장실" value={toilet.hasAccessible ? '이용 가능' : '없음'} good={toilet.hasAccessible} />
            <Row label="기저귀 교환대" value={toilet.hasDiaperTable ? '있음' : '없음'} good={toilet.hasDiaperTable} />
            <Row label="남녀 공용" value={toilet.isUnisex ? '공용' : '남녀 구분'} />
            <Row label="화장지" value={PAPER_TEXT[toilet.toiletPaper]} good={toilet.toiletPaper === 'PROVIDED'} />
            {toilet.hygiene ? (
              <Row label="위생 상태" value={HYGIENE_TEXT[toilet.hygiene]} good={toilet.hygiene === 'CLEAN'} />
            ) : null}
            <Row label="출입 비밀번호" value={PASSCODE_TEXT[toilet.passcode]} />
            {/* UI-11: 도어락 정보 안내 문구와 관리 주체의 삭제 요청 방법 */}
            <View style={styles.doorlockNote}>
              <Text style={styles.doorlockText}>
                도어락 정보는 일반에 개방된 화장실에 한해 제공해요. 화장실을 관리하는 분은 아래에서
                삭제를 요청할 수 있어요.
              </Text>
              <Pressable
                onPress={() => setErrorReport({ reason: 'DOORLOCK_REMOVAL' })}
                accessibilityRole="button"
                hitSlop={8}
              >
                <Text style={styles.doorlockLink}>도어락 정보 삭제 요청</Text>
              </Pressable>
            </View>
          </Section>

          <Section title="운영시간">
            <Text style={styles.text}>{toilet.openTime || '운영시간 정보가 없어요.'}</Text>
            {toilet.holidayNote ? <Text style={styles.sub}>{toilet.holidayNote}</Text> : null}
          </Section>

          {toilet.entryGuide ? (
            <Section title="출입 방법">
              <Text style={styles.text}>{toilet.entryGuide}</Text>
            </Section>
          ) : null}

          <Section title="최근 사용자 제보">
            {toilet.recentReport ? (
              <View style={styles.report}>
                <View style={styles.reportHead}>
                  <Text style={styles.sub}>{formatDateTime(toilet.recentReport.createdAt)}</Text>
                  <Text style={styles.reportTag}>{toilet.recentReport.tag}</Text>
                </View>
                <Text style={styles.text}>“{toilet.recentReport.text}”</Text>
              </View>
            ) : (
              <Text style={styles.sub}>아직 제보가 없어요.</Text>
            )}
            {toilet.updatedAt ? (
              <Text style={styles.updated}>마지막 정보 업데이트 {formatDateTime(toilet.updatedAt)}</Text>
            ) : null}
            {refreshFailed ? (
              <Text style={styles.warn}>최신 정보를 불러오지 못해 이전 정보를 보여 드려요.</Text>
            ) : null}
          </Section>
        </View>
      </ScrollView>

      <View style={styles.actions}>
        <Pressable
          onPress={() =>
            openDirections(
              { name: toilet.name, latitude: toilet.latitude, longitude: toilet.longitude },
              userLocation,
            )
          }
          accessibilityRole="button"
          style={[styles.btn, styles.btnPrimary, styles.btnFull]}
        >
          <Text style={styles.btnPrimaryText}>길찾기</Text>
        </Pressable>
        <View style={styles.actionRow}>
          <Pressable
            onPress={() => navigate(routeWith('/report', { id: toilet.id }))}
            accessibilityRole="button"
            style={[styles.btn, styles.btnOutline]}
          >
            <Text style={styles.btnOutlineText}>제보하기</Text>
          </Pressable>
          <Pressable
            onPress={() => setErrorReport({})}
            accessibilityRole="button"
            style={[styles.btn, styles.btnOutline]}
          >
            <Text style={styles.btnOutlineText}>정보 오류 신고</Text>
          </Pressable>
        </View>
      </View>

      {errorReport ? (
        <ErrorReportModal
          key={toilet.id}
          toilet={toilet}
          initialReason={errorReport.reason}
          onClose={() => setErrorReport(null)}
        />
      ) : null}
    </View>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Row({ label, value, good = false }: { label: string; value: string; good?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, good && { color: colors.green }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { flex: 1, backgroundColor: colors.surface },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, backgroundColor: colors.surface },
  emptyText: { fontSize: 14, color: colors.subText, textAlign: 'center', lineHeight: 22 },
  scroll: { paddingBottom: spacing.lg },
  photo: {
    height: 190,
    backgroundColor: colors.graySoft,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  photoIcon: { fontSize: 40 },
  photoNote: { fontSize: 12, color: colors.subText },
  photoCount: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  photoCountText: { fontSize: 12, color: colors.text },
  close: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: { fontSize: 20, color: colors.text, lineHeight: 22 },
  body: { padding: spacing.xl, gap: 6 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  closing: { fontSize: 13, color: colors.subText },
  name: { fontSize: 22, fontWeight: '800', color: colors.text, marginTop: spacing.xs },
  address: { fontSize: 14, color: colors.subText },
  section: { marginTop: spacing.lg, paddingTop: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border, gap: 6 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  rowLabel: { fontSize: 14, color: colors.subText },
  rowValue: { fontSize: 14, fontWeight: '600', color: colors.text },
  text: { fontSize: 14, color: colors.text, lineHeight: 21 },
  sub: { fontSize: 13, color: colors.subText },
  report: { gap: 4 },
  reportHead: { flexDirection: 'row', justifyContent: 'space-between' },
  reportTag: { fontSize: 12, fontWeight: '700', color: colors.green },
  updated: { fontSize: 12, color: colors.mutedText, marginTop: spacing.xs },
  warn: { fontSize: 12, color: colors.orange },
  doorlockNote: { marginTop: spacing.sm, gap: 4, padding: spacing.md, borderRadius: radius.sm, backgroundColor: colors.surfaceAlt },
  doorlockText: { fontSize: 12, color: colors.subText, lineHeight: 18 },
  doorlockLink: { fontSize: 12, fontWeight: '700', color: colors.primary },
  actionRow: { flexDirection: 'row', gap: spacing.sm },
  btnFull: { flex: 0, alignSelf: 'stretch' },
  actions: {
    gap: spacing.sm,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  btn: { flex: 1, height: 46, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  btnPrimary: { backgroundColor: colors.primary, borderColor: colors.primary, flex: 1.4 },
  btnPrimaryText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  btnOutline: { backgroundColor: colors.surface, borderColor: colors.border },
  btnOutlineText: { color: colors.text, fontSize: 14, fontWeight: '600' },
});

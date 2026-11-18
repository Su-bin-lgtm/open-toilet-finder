import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState, type ReactNode } from 'react';
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import DirectionsSheet from '../components/DirectionsSheet';
import OpenBadge from '../components/OpenBadge';
import PrimaryButton from '../components/PrimaryButton';
import StateView from '../components/StateView';
import { useNearbyToilets } from '../hooks/useNearbyToilets';
import type { RootStackProps } from '../navigation/types';
import { fetchToiletDetail } from '../services/api';
import { notify } from '../services/notify';
import { MAP_APPS, openDirections, type MapAppId } from '../services/mapLink';
import {
  HYGIENE_LABEL,
  PAPER_LABEL,
  formatDistance,
  formatRelativeTime,
  getAccessStatus,
} from '../services/toiletLogic';
import { colors, radius, spacing } from '../theme';
import type { DoorLockInfo } from '../types/toilet';

function doorLockLines(door: DoorLockInfo): string[] {
  if (!door.hasLock) return ['도어락이 있다는 제보가 없어요.'];
  const lines: string[] = [];
  if (door.method) lines.push(`방식: ${door.method}`);
  if (door.code) lines.push(`번호: ${door.code}`);
  if (door.hint) lines.push(door.hint);
  return lines.length > 0 ? lines : ['도어락이 있어요. 출입 방법은 아직 제보되지 않았어요.'];
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

export default function DetailScreen({ route, navigation }: RootStackProps<'Detail'>) {
  const { toiletId } = route.params;
  const { getToilet, upsertToilet, now } = useNearbyToilets();
  const toilet = getToilet(toiletId);

  const [initialLoading, setInitialLoading] = useState(toilet === undefined);
  const [error, setError] = useState<string | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);

  // 화면이 보일 때마다 서버에서 최신 정보를 받아 목록에도 반영한다.
  // (제보 화면에서 돌아왔을 때도 이 흐름으로 최신 상태가 보인다.)
  const reload = useCallback(async () => {
    try {
      const latest = await fetchToiletDetail(toiletId);
      upsertToilet(latest);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : '정보를 불러오지 못했어요.');
    } finally {
      setInitialLoading(false);
    }
  }, [toiletId, upsertToilet]);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  if (!toilet) {
    return initialLoading ? (
      <StateView kind="loading" message="정보를 불러오는 중이에요…" />
    ) : (
      <StateView
        kind="error"
        message={error ?? '화장실 정보를 찾을 수 없어요.'}
        onRetry={() => {
          setInitialLoading(true);
          void reload();
        }}
      />
    );
  }

  const status = getAccessStatus(toilet, now);

  const handleSelectApp = async (app: MapAppId) => {
    setSheetVisible(false);
    try {
      const result = await openDirections(app, {
        name: toilet.name,
        latitude: toilet.latitude,
        longitude: toilet.longitude,
      });
      if (result === 'web' && app === 'naver') {
        notify('웹 지도로 열었어요', '네이버지도 앱을 찾지 못해 구글 지도(웹)로 안내해요.');
      }
    } catch {
      const label = MAP_APPS.find((a) => a.id === app)?.label ?? '지도';
      notify('길찾기를 열 수 없어요', `${label}를 열 수 없어요. 다른 지도 앱을 선택해 보세요.`);
    }
  };

  return (
    <>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.name}>{toilet.name}</Text>
        <Text style={styles.address}>{toilet.address}</Text>
        <View style={styles.row}>
          <OpenBadge status={status} />
          {toilet.distanceM !== undefined && (
            <Text style={styles.distance}>{formatDistance(toilet.distanceM)}</Text>
          )}
        </View>

        <Section title="개방 시간">
          <Text style={styles.body}>{toilet.openTime || '개방시간 정보가 없어요.'}</Text>
          {status === 'LOCKED' && (
            <Text style={styles.warning}>
              {formatRelativeTime(toilet.lastReportedAt, now)}에 문이 잠겨 있었다는 제보가 있어요.
            </Text>
          )}
        </Section>

        <Section title="출입 방법">
          {doorLockLines(toilet.doorLock).map((line) => (
            <Text key={line} style={styles.body}>
              {line}
            </Text>
          ))}
        </Section>

        <Section title="현재 상태 (이용자 제보)">
          <Text style={styles.body}>
            {HYGIENE_LABEL[toilet.hygiene]} · {PAPER_LABEL[toilet.toiletPaper]}
          </Text>
          <Text style={styles.sub}>마지막 제보: {formatRelativeTime(toilet.lastReportedAt, now)}</Text>
        </Section>

        <Section title="편의시설">
          <Text style={styles.body}>
            {toilet.hasAccessible ? '♿ 장애인 화장실 있음' : '장애인 화장실 정보 없음'}
          </Text>
          <Text style={styles.body}>
            {toilet.hasDiaperTable ? '🍼 기저귀 교환대 있음' : '기저귀 교환대 정보 없음'}
          </Text>
          <Text style={styles.body}>
            {toilet.isUnisex ? '🚻 남녀 공용' : '남녀 공용 정보 없음'}
          </Text>
        </Section>

        {(toilet.managingOrg || toilet.phone) && (
          <Section title="관리 정보">
            {toilet.managingOrg && <Text style={styles.body}>{toilet.managingOrg}</Text>}
            {toilet.phone && (
              <Text
                style={[styles.body, styles.link]}
                accessibilityRole="link"
                onPress={() => void Linking.openURL(`tel:${toilet.phone?.replace(/[^0-9+]/g, '')}`)}
              >
                {toilet.phone}
              </Text>
            )}
          </Section>
        )}

        <View style={styles.actions}>
          <PrimaryButton label="길찾기" onPress={() => setSheetVisible(true)} />
          <PrimaryButton
            label="상태 제보하기"
            variant="secondary"
            onPress={() => navigation.navigate('Report', { toiletId })}
          />
          <PrimaryButton
            label="잘못된 정보 신고"
            variant="danger"
            onPress={() => navigation.navigate('ErrorReport', { toiletId })}
          />
        </View>
      </ScrollView>

      <DirectionsSheet
        visible={sheetVisible}
        onSelect={(app) => void handleSelectApp(app)}
        onClose={() => setSheetVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.md },
  name: { fontSize: 22, fontWeight: '800', color: colors.text },
  address: { fontSize: 14, color: colors.subText },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  distance: { fontSize: 14, color: colors.primary, fontWeight: '600' },
  section: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: colors.subText, marginBottom: spacing.xs },
  body: { fontSize: 15, color: colors.text },
  sub: { fontSize: 13, color: colors.subText },
  warning: { fontSize: 13, color: colors.locked, fontWeight: '600' },
  link: { color: colors.primary, textDecorationLine: 'underline' },
  actions: { gap: spacing.sm, marginTop: spacing.sm },
});

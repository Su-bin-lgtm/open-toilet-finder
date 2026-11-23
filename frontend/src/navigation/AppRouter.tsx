import { StyleSheet, View } from 'react-native';
import TopNav from '../components/TopNav';
import ComingSoonScreen from '../screens/ComingSoonScreen';
import NearbyScreen from '../screens/NearbyScreen';
import { colors } from '../theme';
import { ROUTES, useRoute } from './routes';

/** 상단 메뉴 + 현재 주소에 맞는 화면 */
export default function AppRouter() {
  const path = useRoute();
  const route = ROUTES.find((r) => r.path === path);

  return (
    <View style={styles.root}>
      <TopNav currentPath={path} />
      <View style={styles.content}>
        {path === '/' ? (
          <NearbyScreen />
        ) : (
          <ComingSoonScreen title={route?.label ?? '페이지를 찾을 수 없어요'} known={route !== undefined} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1 },
});

import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ROUTES, navigate } from '../navigation/routes';
import { colors, radius, spacing } from '../theme';

/** 상단 바: 로고 + 메뉴. 현재 화면의 메뉴에 밑줄이 표시된다. */
export default function TopNav({ currentPath }: { currentPath: string }) {
  return (
    <View style={styles.bar}>
      <Pressable
        onPress={() => navigate('/')}
        accessibilityRole="link"
        accessibilityLabel="처음 화면으로"
        style={styles.brand}
      >
        <View style={styles.logo}>
          <Text style={styles.logoText}>OT</Text>
        </View>
        <Text style={styles.brandText}>Open Toilet Finder</Text>
      </Pressable>

      <View style={styles.menu}>
        {ROUTES.filter((r) => r.menu).map((route) => {
          const active = route.path === currentPath;
          return (
            <Pressable
              key={route.path}
              onPress={() => navigate(route.path)}
              accessibilityRole="link"
              accessibilityState={{ selected: active }}
              style={[styles.item, active && styles.itemActive]}
            >
              <Text style={[styles.itemText, active && styles.itemTextActive]}>{route.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.xl,
    gap: 48,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  logo: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  brandText: { fontSize: 18, fontWeight: '700', color: colors.text },
  menu: { flexDirection: 'row', alignItems: 'stretch', gap: 8 },
  item: {
    paddingHorizontal: 18,
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  itemActive: { borderBottomColor: colors.primary },
  itemText: { fontSize: 15, color: colors.text },
  itemTextActive: { color: colors.primary, fontWeight: '700' },
});

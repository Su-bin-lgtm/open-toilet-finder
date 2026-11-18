import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ToiletsProvider } from './src/hooks/useNearbyToilets';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <ToiletsProvider>
        {/* 웹에서는 화면이 너무 넓어지지 않도록 휴대폰 폭의 세로 화면으로 보여 준다. */}
        <View style={styles.outer}>
          <View style={styles.inner}>
            <NavigationContainer>
              <RootNavigator />
            </NavigationContainer>
          </View>
        </View>
      </ToiletsProvider>
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  outer: { flex: 1, backgroundColor: '#E2E8F0' },
  inner: {
    flex: 1,
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 480 : undefined,
    alignSelf: 'center',
    backgroundColor: '#F8FAFC',
    overflow: 'hidden',
  },
});

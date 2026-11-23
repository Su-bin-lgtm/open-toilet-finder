import { StatusBar } from 'expo-status-bar';
import { NearbyToiletsProvider } from './src/hooks/useNearbyToilets';
import AppRouter from './src/navigation/AppRouter';

export default function App() {
  return (
    <NearbyToiletsProvider>
      <AppRouter />
      <StatusBar style="auto" />
    </NearbyToiletsProvider>
  );
}

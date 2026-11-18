import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import ListScreen from '../screens/ListScreen';
import MapScreen from '../screens/MapScreen';
import { colors } from '../theme';
import type { TabParamList } from './types';

const Tab = createBottomTabNavigator<TabParamList>();

export default function MainTabs() {
  return (
    <Tab.Navigator screenOptions={{ tabBarActiveTintColor: colors.primary }}>
      <Tab.Screen
        name="Map"
        component={MapScreen}
        options={{ title: '지도', tabBarIcon: () => <Text>🗺️</Text> }}
      />
      <Tab.Screen
        name="List"
        component={ListScreen}
        options={{ title: '목록', tabBarIcon: () => <Text>📋</Text> }}
      />
    </Tab.Navigator>
  );
}

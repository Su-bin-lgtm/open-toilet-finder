import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DetailScreen from '../screens/DetailScreen';
import ErrorReportScreen from '../screens/ErrorReportScreen';
import ReportScreen from '../screens/ReportScreen';
import MainTabs from './MainTabs';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Tabs" component={MainTabs} options={{ headerShown: false }} />
      <Stack.Screen name="Detail" component={DetailScreen} options={{ title: '화장실 상세' }} />
      <Stack.Screen name="Report" component={ReportScreen} options={{ title: '상태 제보' }} />
      <Stack.Screen
        name="ErrorReport"
        component={ErrorReportScreen}
        options={{ title: '잘못된 정보 신고' }}
      />
    </Stack.Navigator>
  );
}

// 알림창. 웹에서는 react-native 의 Alert.alert 가 아무 동작도 하지 않아서 window.alert 로 대신한다.
import { Alert, Platform } from 'react-native';

export function notify(title: string, message: string, onOk?: () => void): void {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
    onOk?.();
    return;
  }
  Alert.alert(title, message, [{ text: '확인', onPress: onOk }]);
}

// 위치 권한 요청과 현재 좌표 읽기. (expo-location)
import * as Location from 'expo-location';
import type { Coords } from '../types/toilet';

export type LocationResult =
  | { status: 'granted'; coords: Coords }
  | { status: 'denied' }
  | { status: 'error'; message: string };

export async function getCurrentCoords(): Promise<LocationResult> {
  try {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) return { status: 'denied' };

    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return {
      status: 'granted',
      coords: {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      },
    };
  } catch (e) {
    return {
      status: 'error',
      message: e instanceof Error ? e.message : '현재 위치를 가져오지 못했어요.',
    };
  }
}

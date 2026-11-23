// 브라우저의 위치 기능으로 현재 좌표를 가져온다. (FE-06)
// 위치 권한은 localhost 또는 https 주소에서만 요청할 수 있다.
import type { Coords } from '../types/toilet';

export type LocationResult =
  | { status: 'granted'; coords: Coords }
  | { status: 'denied' }
  | { status: 'unavailable'; message: string };

export function getCurrentCoords(): Promise<LocationResult> {
  return new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      resolve({ status: 'unavailable', message: '이 브라우저는 위치 기능을 지원하지 않아요.' });
      return;
    }
    if (typeof window !== 'undefined' && window.isSecureContext === false) {
      resolve({
        status: 'unavailable',
        message: '위치는 localhost 또는 https 주소에서만 사용할 수 있어요.',
      });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          status: 'granted',
          coords: { latitude: position.coords.latitude, longitude: position.coords.longitude },
        }),
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          resolve({ status: 'denied' });
        } else {
          resolve({ status: 'unavailable', message: '현재 위치를 가져오지 못했어요.' });
        }
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 60_000 },
    );
  });
}

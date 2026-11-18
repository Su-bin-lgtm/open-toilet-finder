// 외부 지도 앱(카카오맵·네이버지도·구글지도)으로 도보 길찾기를 넘기는 코드.
// 앱을 직접 열 수 없으면(미설치 등) 웹 주소로 대신 연다.
import { Linking, Platform } from 'react-native';
import { MAP_APP_NAME } from './config';

export type MapAppId = 'kakao' | 'naver' | 'google';

export const MAP_APPS: { id: MapAppId; label: string }[] = [
  { id: 'kakao', label: '카카오맵' },
  { id: 'naver', label: '네이버지도' },
  { id: 'google', label: '구글지도' },
];

export interface Destination {
  name: string;
  latitude: number;
  longitude: number;
}

function buildLinks(app: MapAppId, dest: Destination): { appUrl?: string; webUrl: string } {
  const { latitude: lat, longitude: lng } = dest;
  const name = encodeURIComponent(dest.name);
  const googleWeb = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=walking`;

  switch (app) {
    case 'kakao':
      return {
        // 출발지(sp)를 생략하면 현재 위치에서 출발한다.
        appUrl: `kakaomap://route?ep=${lat},${lng}&by=foot`,
        webUrl: `https://map.kakao.com/link/to/${name},${lat},${lng}`,
      };
    case 'naver':
      return {
        // appname 은 필수. 출발지(slat/slng)를 생략하면 현재 위치에서 출발한다.
        appUrl: `nmap://route/walk?dlat=${lat}&dlng=${lng}&dname=${name}&appname=${MAP_APP_NAME}`,
        // 네이버는 앱 없이 쓸 수 있는 길찾기 웹 주소가 없어 구글 웹으로 대신한다.
        webUrl: googleWeb,
      };
    case 'google':
      return { webUrl: googleWeb };
  }
}

/** 'app' = 선택한 앱을 열었음, 'web' = 웹 주소로 열었음 */
export async function openDirections(
  app: MapAppId,
  dest: Destination,
): Promise<'app' | 'web'> {
  const { appUrl, webUrl } = buildLinks(app, dest);
  // 웹 브라우저에서는 앱 URL Scheme 이 동작하지 않으므로 웹 주소로 연다.
  if (appUrl && Platform.OS !== 'web') {
    try {
      await Linking.openURL(appUrl);
      return 'app';
    } catch {
      // 앱이 없으면 아래 웹 주소로 넘어간다.
    }
  }
  await Linking.openURL(webUrl);
  return 'web';
}

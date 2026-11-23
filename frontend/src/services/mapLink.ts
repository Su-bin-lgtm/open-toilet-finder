// 길찾기: 카카오맵 웹 길찾기 주소를 새 탭으로 연다. (웹 전용이라 앱 URL Scheme 은 쓰지 않는다)
export interface Destination {
  name: string;
  latitude: number;
  longitude: number;
}

export function buildKakaoDirectionsUrl(dest: Destination): string {
  const name = encodeURIComponent(dest.name);
  return `https://map.kakao.com/link/to/${name},${dest.latitude},${dest.longitude}`;
}

export function openDirections(dest: Destination): void {
  window.open(buildKakaoDirectionsUrl(dest), '_blank', 'noopener,noreferrer');
}

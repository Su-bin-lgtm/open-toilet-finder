// 외부 지도앱 길찾기 연동 (FE-14)
//
// 동작 순서
//  1) 휴대폰 브라우저: 카카오맵 앱 URL Scheme(kakaomap://route) 으로 앱을 열어 본다.
//     → 앱이 없어서 화면이 그대로면(약 1.5초 뒤에도 이 페이지가 보이면) 카카오맵 웹 길찾기로 넘어간다.
//  2) PC 브라우저: 카카오맵 웹 길찾기를 새 탭으로 연다.
//  3) 새 탭이 팝업 차단 등으로 열리지 않으면 같은 탭에서 연다.
//
// ※ URL Scheme 의 파라미터(sp, ep, by)는 카카오맵 공식 문서 기준이며, 실제 휴대폰 동작은
//   실기기 테스트(FE-16)에서 확인해야 한다. (iOS 는 앱이 없을 때 안내 창이 먼저 뜰 수 있다.)
import type { Coords } from '../types/toilet';

export interface Destination {
  name: string;
  latitude: number;
  longitude: number;
}

/** 길찾기를 어떻게 열었는지. 화면에서 안내 문구를 고를 때 쓴다. */
export type DirectionsOutcome = 'app' | 'web';

const APP_OPEN_WAIT_MS = 1500;

/** 휴대폰(안드로이드·iOS) 브라우저인지 */
export function isMobileBrowser(userAgent: string): boolean {
  return /Android|iPhone|iPad|iPod/i.test(userAgent);
}

/** 카카오맵 웹 길찾기 주소. 출발지(from)가 있으면 도보 길찾기로 연다. */
export function buildKakaoWebUrl(dest: Destination, from?: Coords | null): string {
  const name = encodeURIComponent(dest.name);
  if (from) {
    return (
      `https://map.kakao.com/link/by/walk/` +
      `${encodeURIComponent('내 위치')},${from.latitude},${from.longitude}/` +
      `${name},${dest.latitude},${dest.longitude}`
    );
  }
  return `https://map.kakao.com/link/to/${name},${dest.latitude},${dest.longitude}`;
}

/** 카카오맵 앱 URL Scheme. 출발지를 생략하면 앱이 현재 위치를 출발지로 쓴다. */
export function buildKakaoAppUrl(dest: Destination, from?: Coords | null): string {
  const sp = from ? `sp=${from.latitude},${from.longitude}&` : '';
  return `kakaomap://route?${sp}ep=${dest.latitude},${dest.longitude}&by=FOOT`;
}

/** 이전 코드와의 호환용 이름 */
export const buildKakaoDirectionsUrl = buildKakaoWebUrl;

function openWeb(url: string): void {
  const opened = window.open(url, '_blank', 'noopener,noreferrer');
  // 팝업이 막혀 새 탭이 열리지 않았다면 현재 탭에서 연다.
  if (!opened) window.location.href = url;
}

/**
 * 길찾기를 연다.
 * @param from 내 위치(알 수 있을 때). 없으면 지도앱이 현재 위치를 사용한다.
 */
export function openDirections(dest: Destination, from?: Coords | null): DirectionsOutcome {
  const webUrl = buildKakaoWebUrl(dest, from);
  if (!isMobileBrowser(navigator.userAgent)) {
    openWeb(webUrl);
    return 'web';
  }

  // 앱이 열리면 이 페이지는 백그라운드로 가므로(hidden), 그때는 웹으로 넘어가지 않는다.
  let appOpened = false;
  const onVisibility = () => {
    if (document.visibilityState === 'hidden') appOpened = true;
  };
  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('pagehide', onVisibility);

  window.setTimeout(() => {
    document.removeEventListener('visibilitychange', onVisibility);
    window.removeEventListener('pagehide', onVisibility);
    if (!appOpened) window.location.href = webUrl; // 앱이 없을 때: 웹 길찾기로 대신한다.
  }, APP_OPEN_WAIT_MS);

  window.location.href = buildKakaoAppUrl(dest, from);
  return 'app';
}

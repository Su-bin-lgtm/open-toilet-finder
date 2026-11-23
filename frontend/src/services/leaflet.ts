// 지도 라이브러리(Leaflet)를 실행할 때 CDN 에서 불러온다. (npm 패키지를 추가하지 않기 위해)
// ※ 지도 서비스(카카오·네이버·OpenStreetMap)가 정해지면 이 파일과 components/ToiletMap.tsx 만 바꾸면 된다.
// Leaflet 은 CDN 으로 불러와 타입 정보가 없으므로 any 로 다룬다.
/* eslint-disable @typescript-eslint/no-explicit-any */

const LEAFLET_JS = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js';
const LEAFLET_CSS = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css';

let loader: Promise<any> | null = null;

export function loadLeaflet(): Promise<any> {
  if (loader) return loader;
  loader = new Promise<any>((resolve, reject) => {
    const w = window as any;
    if (w.L) {
      resolve(w.L);
      return;
    }
    if (!document.querySelector('link[data-leaflet]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = LEAFLET_CSS;
      link.setAttribute('data-leaflet', '1');
      document.head.appendChild(link);
    }
    const script = document.createElement('script');
    script.src = LEAFLET_JS;
    script.async = true;
    script.onload = () => (w.L ? resolve(w.L) : reject(new Error('지도 라이브러리를 불러오지 못했어요.')));
    script.onerror = () => {
      loader = null; // 다음에 다시 시도할 수 있게 한다.
      reject(new Error('지도 라이브러리를 불러오지 못했어요.'));
    };
    document.head.appendChild(script);
  });
  return loader;
}

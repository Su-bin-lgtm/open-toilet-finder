// 화면 이동 (FE-07): 주소 뒤의 #경로 로 화면을 구분하는 간단한 라우터.
// 예) http://localhost:8081/#/report
// - 라이브러리를 추가하지 않고, 서버 설정(새로고침 시 주소 처리) 없이도 어디서나 동작한다.
// - 브라우저의 뒤로가기·새로고침이 화면 주소를 기억한다.
import { useEffect, useState } from 'react';

export interface RouteDef {
  path: string;
  label: string;
  /** 메뉴(상단 바)에 보이는 이름 */
  menu: boolean;
}

export const ROUTES: RouteDef[] = [
  { path: '/', label: '주변 화장실', menu: true },
  { path: '/report', label: '사용자 제보', menu: true },
  { path: '/my-reports', label: '내 제보', menu: true },
];

export function currentPath(): string {
  const hash = window.location.hash.replace(/^#/, '');
  return hash === '' ? '/' : hash;
}

export function navigate(path: string): void {
  window.location.hash = path;
}

/** 현재 경로를 돌려주고, 경로가 바뀌면 다시 그린다. */
export function useRoute(): string {
  const [path, setPath] = useState(currentPath);
  useEffect(() => {
    const onChange = () => setPath(currentPath());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return path;
}

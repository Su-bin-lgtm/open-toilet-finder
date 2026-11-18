import type { Coords } from '../types/toilet';

export interface MapMarker {
  id: string;
  latitude: number;
  longitude: number;
  name: string;
  /** 개방 상태에 따른 마커 색 */
  color: string;
}

/** 지도 컴포넌트가 받는 값. 앱은 AppMap.tsx, 웹은 AppMap.web.tsx 가 같은 값을 받아 그린다. */
export interface AppMapProps {
  /** 기준 위치. 바뀌면 지도가 그 위치로 이동한다. */
  center: Coords;
  markers: MapMarker[];
  selectedId: string | null;
  /** 내 위치(파란 점)를 표시할지 */
  showUserLocation: boolean;
  onMarkerPress: (id: string) => void;
  onMapPress: () => void;
}

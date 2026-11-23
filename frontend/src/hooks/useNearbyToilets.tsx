// 주변 화장실 목록과 검색 기준 위치를 앱 전체가 함께 쓰도록 모아 둔 상태. (FE-09)
// 4주차에 제보 화면 등이 같은 목록을 쓰게 될 것을 대비해 Provider 로 묶었다.
// (README 의 라이브러리 목록에 없는 상태관리 라이브러리 대신 React Context 를 사용)
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { fetchNearbyToilets } from '../services/api';
import { DEFAULT_RADIUS_M, FALLBACK_CENTER } from '../services/config';
import { DEFAULT_FILTER, distanceMeters, withDistance } from '../services/toiletLogic';
import type { Coords, Toilet, ToiletFilter } from '../types/toilet';
import { useCurrentLocation, type LocationStatus } from './useCurrentLocation';

/** 'location' = 내 위치(또는 기본 위치) 기준, 'map' = "현 지도에서 검색"으로 정한 위치 기준 */
export type SearchMode = 'location' | 'map';

interface NearbyContextValue {
  /** 목록의 기준 위치. 처음 위치를 찾는 중이면 null */
  searchCenter: Coords | null;
  searchMode: SearchMode;
  /** 내 위치(지도의 파란 점). 권한이 없으면 null */
  userLocation: Coords | null;
  locationStatus: LocationStatus;
  locationMessage?: string;
  /** 위치를 쓸 수 없어 기본 위치(서울시청)를 쓰고 있는지 */
  usingFallbackCenter: boolean;
  toilets: Toilet[];
  filter: ToiletFilter;
  setFilter: (patch: Partial<ToiletFilter>) => void;
  loading: boolean;
  error: string | null;
  /** 1분마다 갱신되는 현재 시각 (운영 상태 표시가 시간에 맞게 바뀌도록) */
  now: Date;
  /** "현재 위치로 찾기": 위치를 다시 재고 그 위치로 검색 */
  locateAndSearch: () => Promise<void>;
  /** "현 지도에서 검색": 지정한 위치로 검색 */
  searchAt: (center: Coords) => Promise<void>;
  /** 같은 기준 위치로 다시 불러오기 */
  retry: () => Promise<void>;
  getToilet: (id: string) => Toilet | undefined;
  /** 상세 조회로 받은 최신 정보를 목록에 반영 */
  upsertToilet: (toilet: Toilet) => void;
}

const NearbyContext = createContext<NearbyContextValue | null>(null);

export function NearbyToiletsProvider({ children }: { children: ReactNode }) {
  const location = useCurrentLocation();
  const [searchCenter, setSearchCenter] = useState<Coords | null>(null);
  const [searchMode, setSearchMode] = useState<SearchMode>('location');
  const [toilets, setToilets] = useState<Toilet[]>([]);
  const [filter, setFilterState] = useState<ToiletFilter>(DEFAULT_FILTER);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());

  // 콜백이 매번 새로 만들어지지 않도록 최신 값을 ref 에 보관
  const centerRef = useRef<Coords | null>(null);
  centerRef.current = searchCenter;
  const userRef = useRef<Coords | null>(null);
  userRef.current = location.coords;

  // 오래된 응답이 최신 응답을 덮어쓰지 않도록 요청 번호를 붙인다.
  const requestId = useRef(0);

  const load = useCallback(async (target: Coords, mode: SearchMode) => {
    const id = ++requestId.current;
    setSearchCenter(target);
    setSearchMode(mode);
    setLoading(true);
    setError(null);
    try {
      const list = await fetchNearbyToilets({ ...target, radius: DEFAULT_RADIUS_M });
      if (id !== requestId.current) return;
      setToilets(withDistance(list, target));
    } catch (e) {
      if (id !== requestId.current) return;
      setError(e instanceof Error ? e.message : '화장실 정보를 불러오지 못했어요.');
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, []);

  // 위치 확인이 끝나면(허용·거부 모두) 처음 한 번 불러온다.
  const didInitialLoad = useRef(false);
  useEffect(() => {
    if (location.status === 'loading' || didInitialLoad.current) return;
    didInitialLoad.current = true;
    void load(location.coords ?? FALLBACK_CENTER, 'location');
  }, [location.status, location.coords, load]);

  // 1분마다 현재 시각 갱신
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const { refresh: refreshLocation } = location;
  const locateAndSearch = useCallback(async () => {
    const fresh = await refreshLocation();
    await load(fresh ?? userRef.current ?? FALLBACK_CENTER, 'location');
  }, [refreshLocation, load]);

  const searchAt = useCallback((center: Coords) => load(center, 'map'), [load]);

  const modeRef = useRef<SearchMode>('location');
  modeRef.current = searchMode;
  const retry = useCallback(
    () => load(centerRef.current ?? FALLBACK_CENTER, modeRef.current),
    [load],
  );

  const setFilter = useCallback((patch: Partial<ToiletFilter>) => {
    setFilterState((prev) => ({ ...prev, ...patch }));
  }, []);

  const upsertToilet = useCallback((toilet: Toilet) => {
    const c = centerRef.current;
    const next = c ? { ...toilet, distanceM: distanceMeters(c, toilet) } : toilet;
    setToilets((prev) =>
      prev.some((t) => t.id === next.id)
        ? prev.map((t) => (t.id === next.id ? next : t))
        : [...prev, next],
    );
  }, []);

  const getToilet = useCallback((id: string) => toilets.find((t) => t.id === id), [toilets]);

  const usingFallbackCenter = location.coords === null && location.status !== 'loading';

  const value = useMemo<NearbyContextValue>(
    () => ({
      searchCenter,
      searchMode,
      userLocation: location.coords,
      locationStatus: location.status,
      locationMessage: location.message,
      usingFallbackCenter,
      toilets,
      filter,
      setFilter,
      loading,
      error,
      now,
      locateAndSearch,
      searchAt,
      retry,
      getToilet,
      upsertToilet,
    }),
    [
      searchCenter,
      searchMode,
      location.coords,
      location.status,
      location.message,
      usingFallbackCenter,
      toilets,
      filter,
      setFilter,
      loading,
      error,
      now,
      locateAndSearch,
      searchAt,
      retry,
      getToilet,
      upsertToilet,
    ],
  );

  return <NearbyContext.Provider value={value}>{children}</NearbyContext.Provider>;
}

export function useNearbyToilets(): NearbyContextValue {
  const ctx = useContext(NearbyContext);
  if (!ctx) throw new Error('useNearbyToilets 는 NearbyToiletsProvider 안에서만 쓸 수 있어요.');
  return ctx;
}

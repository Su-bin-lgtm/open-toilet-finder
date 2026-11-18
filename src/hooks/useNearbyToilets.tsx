// 앱 전체가 함께 쓰는 "화장실 목록 상태".
// 지도 탭, 목록 탭, 상세 화면이 같은 데이터를 보도록 Provider 하나로 묶었다.
// (README 의 라이브러리 목록에 없는 상태관리 라이브러리를 쓰지 않으려고 React Context 를 사용)
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
import {
  DEFAULT_FILTER,
  applyFilter,
  distanceMeters,
  withDistance,
} from '../services/toiletLogic';
import type { Coords, Toilet, ToiletFilter } from '../types/toilet';
import { useCurrentLocation, type LocationStatus } from './useCurrentLocation';

interface ToiletsContextValue {
  /** 검색 기준 위치. 위치를 찾는 중이면 null */
  center: Coords | null;
  locationStatus: LocationStatus;
  /** 위치 권한이 없어 기본 위치(서울시청)를 쓰고 있는지 */
  usingFallbackCenter: boolean;
  /** 필터 적용 전 전체 목록 */
  toilets: Toilet[];
  /** 필터 적용 + 가까운 순 */
  visibleToilets: Toilet[];
  filter: ToiletFilter;
  setFilter: (patch: Partial<ToiletFilter>) => void;
  loading: boolean;
  error: string | null;
  /** 위치를 다시 받고 목록을 새로 불러온다 */
  refresh: () => Promise<void>;
  /** 제보/상세 조회로 받은 최신 정보를 목록에 반영한다 */
  upsertToilet: (toilet: Toilet) => void;
  getToilet: (id: string) => Toilet | undefined;
  /** 1분마다 갱신되는 현재 시각 (개방 여부 표시가 시간에 맞게 바뀌도록) */
  now: Date;
}

const ToiletsContext = createContext<ToiletsContextValue | null>(null);

export function ToiletsProvider({ children }: { children: ReactNode }) {
  const location = useCurrentLocation();
  const [toilets, setToilets] = useState<Toilet[]>([]);
  const [filter, setFilterState] = useState<ToiletFilter>(DEFAULT_FILTER);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());

  // 위치를 찾는 동안은 null, 끝났는데 좌표가 없으면(권한 거부 등) 기본 위치
  const center: Coords | null =
    location.coords ?? (location.status === 'loading' ? null : FALLBACK_CENTER);
  const usingFallbackCenter = location.coords === null && location.status !== 'loading';

  // upsertToilet 이 center 가 바뀔 때마다 새로 만들어지지 않도록 ref 에 보관
  const centerRef = useRef<Coords | null>(center);
  useEffect(() => {
    centerRef.current = center;
  }, [center]);

  // 오래된 응답이 최신 응답을 덮어쓰지 않도록 요청 번호를 붙인다.
  const requestId = useRef(0);

  const load = useCallback(async (target: Coords) => {
    const id = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      const list = await fetchNearbyToilets(target, DEFAULT_RADIUS_M);
      if (id !== requestId.current) return;
      setToilets(withDistance(list, target));
    } catch (e) {
      if (id !== requestId.current) return;
      setError(e instanceof Error ? e.message : '화장실 정보를 불러오지 못했어요.');
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, []);

  // 처음 기준 위치가 정해졌을 때 한 번만 불러온다.
  const didInitialLoad = useRef(false);
  useEffect(() => {
    if (center && !didInitialLoad.current) {
      didInitialLoad.current = true;
      void load(center);
    }
  }, [center, load]);

  // 1분마다 현재 시각 갱신
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const { refresh: refreshLocation } = location;
  const refresh = useCallback(async () => {
    const fresh = await refreshLocation();
    await load(fresh ?? centerRef.current ?? FALLBACK_CENTER);
  }, [refreshLocation, load]);

  const setFilter = useCallback((patch: Partial<ToiletFilter>) => {
    setFilterState((prev) => ({ ...prev, ...patch }));
  }, []);

  const upsertToilet = useCallback((toilet: Toilet) => {
    const c = centerRef.current;
    const next = c ? { ...toilet, distanceM: distanceMeters(c, toilet) } : toilet;
    setToilets((prev) =>
      prev.some((t) => t.id === next.id)
        ? prev.map((t) => (t.id === next.id ? next : t))
        : [...prev, next].sort((a, b) => (a.distanceM ?? 0) - (b.distanceM ?? 0)),
    );
  }, []);

  const getToilet = useCallback(
    (id: string) => toilets.find((t) => t.id === id),
    [toilets],
  );

  const visibleToilets = useMemo(
    () => applyFilter(toilets, filter, now),
    [toilets, filter, now],
  );

  const value = useMemo<ToiletsContextValue>(
    () => ({
      center,
      locationStatus: location.status,
      usingFallbackCenter,
      toilets,
      visibleToilets,
      filter,
      setFilter,
      loading,
      error,
      refresh,
      upsertToilet,
      getToilet,
      now,
    }),
    [
      center,
      location.status,
      usingFallbackCenter,
      toilets,
      visibleToilets,
      filter,
      setFilter,
      loading,
      error,
      refresh,
      upsertToilet,
      getToilet,
      now,
    ],
  );

  return <ToiletsContext.Provider value={value}>{children}</ToiletsContext.Provider>;
}

export function useNearbyToilets(): ToiletsContextValue {
  const ctx = useContext(ToiletsContext);
  if (!ctx) throw new Error('useNearbyToilets 는 ToiletsProvider 안에서만 쓸 수 있어요.');
  return ctx;
}

import { useCallback, useEffect, useRef, useState } from 'react';
import { getCurrentCoords } from '../services/location';
import type { Coords } from '../types/toilet';

export type LocationStatus = 'loading' | 'granted' | 'denied' | 'error';

interface LocationState {
  coords: Coords | null;
  status: LocationStatus;
  message?: string;
}

/** 현재 위치를 받아 오는 훅. 앱이 켜질 때 한 번 받고, refresh() 로 다시 받을 수 있다. */
export function useCurrentLocation() {
  const [state, setState] = useState<LocationState>({ coords: null, status: 'loading' });
  const mounted = useRef(true);

  const refresh = useCallback(async (): Promise<Coords | null> => {
    // 다시 받는 동안에도 이전 좌표는 그대로 둔다(지도가 깜빡이지 않도록).
    setState((prev) => ({ ...prev, status: 'loading', message: undefined }));
    const result = await getCurrentCoords();
    if (!mounted.current) return null;

    if (result.status === 'granted') {
      setState({ coords: result.coords, status: 'granted' });
      return result.coords;
    }
    setState((prev) => ({
      coords: prev.coords,
      status: result.status,
      message: result.status === 'error' ? result.message : undefined,
    }));
    return null;
  }, []);

  useEffect(() => {
    mounted.current = true;
    void refresh();
    return () => {
      mounted.current = false;
    };
  }, [refresh]);

  return { ...state, refresh };
}

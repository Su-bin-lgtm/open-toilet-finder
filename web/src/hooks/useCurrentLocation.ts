import { useState } from 'react'
import type { Coordinates } from '../types/toilet'

export function useCurrentLocation() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function getCurrentLocation(): Promise<Coordinates> {
    setError(null)
    if (!navigator.geolocation) {
      const message = '이 브라우저에서는 위치 기능을 사용할 수 없습니다.'
      setError(message)
      return Promise.reject(new Error(message))
    }

    setIsLoading(true)
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          setIsLoading(false)
          resolve({ latitude: coords.latitude, longitude: coords.longitude })
        },
        (positionError) => {
          setIsLoading(false)
          const message = positionError.code === positionError.PERMISSION_DENIED
            ? '위치 권한을 허용하면 주변 화장실을 찾을 수 있습니다.'
            : '현재 위치를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.'
          setError(message)
          reject(new Error(message))
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
      )
    })
  }

  return { getCurrentLocation, isLoading, error }
}

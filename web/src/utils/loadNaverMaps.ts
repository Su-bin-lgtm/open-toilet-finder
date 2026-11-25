let sdkPromise: Promise<NaverMapsNamespace> | null = null
let cachedClientId = ''

export function loadNaverMaps(clientId: string): Promise<NaverMapsNamespace> {
  if (!clientId) return Promise.reject(new Error('네이버 지도 Client ID가 설정되지 않았습니다.'))
  if (sdkPromise && cachedClientId === clientId) return sdkPromise

  sdkPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById('naver-maps-sdk') as HTMLScriptElement | null
    if (window.naver?.maps) {
      resolve(window.naver.maps)
      return
    }
    existing?.remove()

    const previousAuthFailure = window.navermap_authFailure
    window.navermap_authFailure = () => {
      previousAuthFailure?.()
      window.dispatchEvent(new Event('naver-maps-auth-failure'))
    }

    const script = document.createElement('script')
    script.id = 'naver-maps-sdk'
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${encodeURIComponent(clientId)}`
    script.async = true
    script.onload = () => {
      if (!window.naver?.maps) {
        sdkPromise = null
        reject(new Error('네이버 지도 SDK가 초기화되지 않았습니다.'))
        return
      }
      resolve(window.naver.maps)
    }
    script.onerror = () => {
      sdkPromise = null
      reject(new Error('네이버 지도 SDK를 불러오지 못했습니다. Client ID와 등록 도메인을 확인해 주세요.'))
    }
    document.head.append(script)
  })

  cachedClientId = clientId
  return sdkPromise
}

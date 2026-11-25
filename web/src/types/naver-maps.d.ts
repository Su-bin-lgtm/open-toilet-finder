interface NaverLatLng {
  lat(): number
  lng(): number
}

interface NaverLatLngBounds {
  extend(position: NaverLatLng): NaverLatLngBounds
}

interface NaverPoint {
  x: number
  y: number
}

interface NaverSize {
  width: number
  height: number
}

interface NaverMapInstance {
  autoResize(): void
  destroy(): void
  fitBounds(bounds: NaverLatLngBounds, options?: { top?: number; right?: number; bottom?: number; left?: number; maxZoom?: number }): void
  panTo(position: NaverLatLng): void
  setCenter(position: NaverLatLng): void
  setZoom(zoom: number, effect?: boolean): void
}

interface NaverMarkerInstance {
  setMap(map: NaverMapInstance | null): void
  setIcon(icon: { url: string; size: NaverSize; anchor: NaverPoint }): void
  setZIndex(zIndex: number): void
}

interface NaverCircleInstance {
  setMap(map: NaverMapInstance | null): void
}

interface NaverInfoWindowInstance {
  close(): void
  open(map: NaverMapInstance, anchor?: NaverMarkerInstance): void
  setContent(content: string | HTMLElement): void
}

interface NaverMapsNamespace {
  LatLng: new (latitude: number, longitude: number) => NaverLatLng
  LatLngBounds: new () => NaverLatLngBounds
  Point: new (x: number, y: number) => NaverPoint
  Size: new (width: number, height: number) => NaverSize
  Map: new (element: HTMLElement, options: {
    center: NaverLatLng
    zoom: number
    zoomControl: boolean
    zoomControlOptions: { position: number; style: number }
  }) => NaverMapInstance
  Marker: new (options: { position: NaverLatLng; map: NaverMapInstance; title: string; icon?: { url: string; size: NaverSize; anchor: NaverPoint } }) => NaverMarkerInstance
  InfoWindow: new (options?: { content?: string | HTMLElement; maxWidth?: number }) => NaverInfoWindowInstance
  Circle: new (options: {
    map: NaverMapInstance
    center: NaverLatLng
    radius: number
    fillColor: string
    fillOpacity: number
    strokeColor: string
    strokeOpacity: number
    strokeWeight: number
  }) => NaverCircleInstance
  ZoomControlStyle: { SMALL: number }
  Position: { RIGHT_CENTER: number }
  Event: { addListener(target: object, eventName: string, callback: () => void): object }
}

interface Window {
  naver?: { maps: NaverMapsNamespace }
  navermap_authFailure?: () => void
}

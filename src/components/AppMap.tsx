// 앱(안드로이드·iOS)용 지도: react-native-maps
import { useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';
import MapView, { Marker, type MapPressEvent } from 'react-native-maps';
import type { AppMapProps } from './AppMap.types';

const REGION_DELTA = 0.02; // 지도에 보이는 범위(약 2km)

export default function AppMap({
  center,
  markers,
  showUserLocation,
  onMarkerPress,
  onMapPress,
}: AppMapProps) {
  const mapRef = useRef<MapView>(null);

  // 기준 위치가 바뀌면(다시 찾기) 지도도 그 위치로 이동
  const { latitude, longitude } = center;
  useEffect(() => {
    mapRef.current?.animateToRegion(
      { latitude, longitude, latitudeDelta: REGION_DELTA, longitudeDelta: REGION_DELTA },
      400,
    );
  }, [latitude, longitude]);

  const handleMapPress = (event: MapPressEvent) => {
    // 안드로이드는 마커를 눌러도 지도 press 가 같이 올 수 있어 걸러 준다.
    if (event.nativeEvent.action === 'marker-press') return;
    onMapPress();
  };

  return (
    <MapView
      ref={mapRef}
      style={StyleSheet.absoluteFill}
      initialRegion={{ latitude, longitude, latitudeDelta: REGION_DELTA, longitudeDelta: REGION_DELTA }}
      showsUserLocation={showUserLocation}
      showsMyLocationButton={false}
      onPress={handleMapPress}
    >
      {markers.map((m) => (
        <Marker
          key={m.id}
          coordinate={{ latitude: m.latitude, longitude: m.longitude }}
          pinColor={m.color}
          onPress={() => onMarkerPress(m.id)}
        />
      ))}
    </MapView>
  );
}

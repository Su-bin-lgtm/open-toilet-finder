// 웹용 지도: react-native-maps 는 웹에서 동작하지 않아서 Leaflet(+OpenStreetMap)을 iframe 안에 띄운다.
// - npm 라이브러리를 추가하지 않고, Leaflet 은 실행할 때 CDN 에서 받아 온다. (시연 중 인터넷 연결 필요)
// - 앱 ↔ iframe 은 postMessage 로 값을 주고받는다. (마커 정보를 HTML 문자열에 끼워 넣지 않는다)
import { createElement, useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import type { AppMapProps } from './AppMap.types';

const LEAFLET_CSS = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css';
const LEAFLET_JS = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js';

const MAP_HTML = `<!doctype html>
<html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="stylesheet" href="${LEAFLET_CSS}">
<style>html,body,#map{height:100%;margin:0}</style></head>
<body><div id="map"></div>
<script src="${LEAFLET_JS}"></script>
<script>
(function () {
  var post = function (msg) { msg.source = 'toilet-map'; parent.postMessage(msg, '*'); };
  if (typeof L === 'undefined') {
    document.body.innerHTML = '<p style="font:14px sans-serif;padding:16px">지도를 불러오지 못했어요. 인터넷 연결을 확인해 주세요.</p>';
    return;
  }
  var map = L.map('map').setView([37.5665, 126.978], 15);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);
  var markerLayer = L.layerGroup().addTo(map);
  var userDot = null;
  var lastCenter = '';

  map.on('click', function () { post({ type: 'mapPress' }); });

  window.addEventListener('message', function (e) {
    var d = e.data;
    if (!d || d.source !== 'toilet-app') return;

    markerLayer.clearLayers();
    d.markers.forEach(function (m) {
      var selected = m.id === d.selectedId;
      var dot = L.circleMarker([m.latitude, m.longitude], {
        radius: selected ? 14 : 10, color: '#ffffff', weight: 3,
        fillColor: m.color, fillOpacity: 1
      }).addTo(markerLayer);
      dot.on('click', function (ev) {
        L.DomEvent.stopPropagation(ev);
        post({ type: 'markerPress', id: m.id });
      });
    });

    if (userDot) { map.removeLayer(userDot); userDot = null; }
    if (d.showUser) {
      userDot = L.circleMarker([d.center.latitude, d.center.longitude], {
        radius: 7, color: '#ffffff', weight: 3, fillColor: '#2563EB', fillOpacity: 1
      }).addTo(map);
    }

    var key = d.center.latitude + ',' + d.center.longitude;
    if (key !== lastCenter) {
      lastCenter = key;
      map.setView([d.center.latitude, d.center.longitude], 15);
    }
  });

  post({ type: 'ready' });
})();
</script></body></html>`;

export default function AppMap(props: AppMapProps) {
  const frameRef = useRef<HTMLIFrameElement | null>(null);
  const ready = useRef(false);
  const latest = useRef(props);
  latest.current = props;

  const send = () => {
    const { center, markers, selectedId, showUserLocation } = latest.current;
    frameRef.current?.contentWindow?.postMessage(
      { source: 'toilet-app', center, markers, selectedId, showUser: showUserLocation },
      '*',
    );
  };

  // iframe 에서 오는 메시지(준비 완료, 마커 클릭, 지도 클릭) 처리
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.source !== frameRef.current?.contentWindow) return;
      const data = event.data as { source?: string; type?: string; id?: unknown } | null;
      if (!data || data.source !== 'toilet-map') return;
      if (data.type === 'ready') {
        ready.current = true;
        send();
      } else if (data.type === 'markerPress' && typeof data.id === 'string') {
        latest.current.onMarkerPress(data.id);
      } else if (data.type === 'mapPress') {
        latest.current.onMapPress();
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  // 값이 바뀔 때마다 지도에 다시 전달
  useEffect(() => {
    if (ready.current) send();
  }, [props.center, props.markers, props.selectedId, props.showUserLocation]);

  return (
    <View style={StyleSheet.absoluteFill}>
      {createElement('iframe', {
        ref: frameRef,
        srcDoc: MAP_HTML,
        title: '주변 화장실 지도',
        style: { border: 0, width: '100%', height: '100%' },
      })}
    </View>
  );
}

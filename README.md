# frontend 웹 시연 버전 (Expo + TypeScript)

개방화장실 실시간 정보 앱의 프론트엔드입니다. 같은 코드로 **웹 브라우저**와 휴대폰 앱(Expo Go)에서 실행할 수 있고,
서버가 없어도 샘플 데이터로 모든 화면이 동작합니다.

> 이 폴더는 시연용으로 기능을 미리 만들어 둔 버전입니다. 팀 합의 전 라이브러리가 들어 있어서(아래 표)

## 웹에서 실행

```bash
cd frontend
npm install
npx expo start --web      # 브라우저가 열림 (http://localhost:8081)
```

- 서버 주소를 비워 두면(`.env` 없음) 샘플 데이터로 동작합니다. 샘플 화장실은 실제 장소가 아니며, 현재 위치 주변에 만들어집니다.
- 위치는 브라우저의 위치 권한을 씁니다. `localhost` 또는 `https` 주소에서만 동작하고, 권한을 거부하면 기본 위치(서울시청)로 보여 줍니다.
- **지도는 인터넷 연결이 필요합니다.** (Leaflet 과 OpenStreetMap 타일을 실행할 때 내려받습니다.)

## 시연용 정적 파일 만들기

```bash
npx expo export --platform web      # dist/ 폴더 생성
npx serve dist                      # 또는 아무 정적 서버로 dist/ 를 localhost 로 열기
```

`index.html` 을 더블클릭해서(file://) 열면 위치와 지도가 동작하지 않습니다. 꼭 서버로 여세요.

## 휴대폰 앱으로 실행

```bash
npx expo start      # 휴대폰의 Expo Go 앱으로 QR 스캔
```

## 웹과 앱의 차이

| 항목 | 앱 | 웹 |
|---|---|---|
| 지도 | react-native-maps (`AppMap.tsx`) | Leaflet iframe (`AppMap.web.tsx`) |
| 알림창 | Alert | window.alert (`services/notify.ts`) |
| 길찾기 | 카카오맵·네이버지도 앱 → 없으면 웹 | 웹 주소로 열기 |
| 목록 새로고침 | 아래로 당기기, 버튼 | 버튼 |
| 브라우저 뒤로가기·새로고침 | 해당 없음 | 화면을 기억하지 않음 (앱 안의 뒤로가기 버튼 사용) |

## 백엔드와 연결할 때

1. `.env.example` 을 복사해 `.env` 를 만들고 `EXPO_PUBLIC_API_BASE_URL` 에 서버 주소를 적습니다.
2. **웹은 브라우저가 서버를 호출하므로 CORS 설정이 필요합니다.** 백엔드(BE-11)에서 `http://localhost:8081` 을 허용해야 합니다.
3. 주소와 응답 모양은 `src/services/api.ts`, `src/types/toilet.ts` 의 초안입니다. API 명세 합의(COM-04) 후 맞춥니다.

## 팀과 상의가 필요한 라이브러리

| 라이브러리 | 용도 |
|---|---|
| `@react-navigation/native`, `native-stack`, `bottom-tabs`, `react-native-screens`, `react-native-safe-area-context` | 화면 이동 |
| `expo-location` | 현재 위치 (앱·웹 공통) |
| `react-native-maps` | 앱 지도 |
| `react-dom`, `react-native-web`, `@expo/metro-runtime` | 웹 실행 |

## 폴더 구조

```text
src/
├── components/   재사용 UI (AppMap, FilterBar, ToiletCard, DirectionsSheet …)
├── screens/      MapScreen, ListScreen, DetailScreen, ReportScreen, ErrorReportScreen
├── navigation/   하단 탭(지도·목록) + 스택(상세·제보·오류 신고)
├── services/     api, mockData(가짜 서버), location, mapLink, notify, toiletLogic
├── hooks/        useCurrentLocation, useNearbyToilets(앱 전체 상태)
└── types/        서버와 주고받는 데이터 모양
```

## 알려진 한계

- 개방 여부는 공공데이터의 개방시간 문구를 해석합니다. 해석할 수 없는 문구는 "시간 정보 없음"으로 표시하고, 공휴일은 반영하지 않습니다.
- 카카오맵·네이버지도 앱 연동 링크는 공식 문서 기준으로 작성했고 실기기 확인은 하지 않았습니다.
- 앱(휴대폰) 화면은 직접 확인하지 못했고, 웹은 브라우저에서 실행해 확인했습니다.

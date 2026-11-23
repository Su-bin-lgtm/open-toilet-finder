# frontend (Expo + TypeScript, 웹 전용)

개방화장실 실시간 정보 서비스의 프론트엔드입니다. 모바일 앱은 만들지 않고 **웹 브라우저**용으로 개발합니다.
서버가 없어도 샘플 데이터로 모든 화면이 동작합니다.

## 실행 방법

```bash
cd frontend
npm install
cp .env.example .env     # 윈도우 PowerShell: Copy-Item .env.example .env
npx expo start --web     # 브라우저가 열림 (http://localhost:8081)
```

- `.env` 의 서버 주소를 비워 두면 샘플 데이터(mock)로 동작합니다. 샘플 화장실은 실제 장소가 아니며, 현재 위치 주변에 만들어집니다.
- 위치는 브라우저의 위치 권한을 씁니다. `localhost` 또는 `https` 주소에서만 동작하고, 거부하면 기본 위치(서울시청)로 보여 줍니다.
- **지도는 인터넷 연결이 필요합니다.** (Leaflet 과 OpenStreetMap 타일을 실행할 때 내려받습니다.)
- 타입 검사: `npm run typecheck`
- 시연용 정적 파일: `npm run build:web` → `dist/` 폴더를 `localhost` 로 서비스합니다. (예: `npx serve dist`)

## 화면과 주소

화면은 주소 뒤의 `#경로` 로 구분합니다. 브라우저 뒤로가기와 새로고침이 화면을 기억합니다.

| 주소 | 화면 | 상태 |
|---|---|---|
| `/#/` | 주변 화장실 (목록 · 지도 · 상세) | 3주차 구현 |
| `/#/report` | 사용자 제보 | 준비 중 (4주차 이후) |
| `/#/my-reports` | 내 제보 | 준비 중 (4주차 이후) |

## 폴더 구조

```text
src/
├── components/   TopNav, ToiletListPanel, ToiletCard, ToiletMap, ToiletDetailPanel, StatusBadge, Chip
├── screens/      NearbyScreen(주변 화장실), ComingSoonScreen(준비 중)
├── navigation/   routes.ts(주소 → 화면 이동), AppRouter.tsx
├── services/     api(서버 호출), mockData(가짜 서버), location(위치), leaflet(지도 로딩),
│                 mapLink(길찾기), toiletLogic(거리·운영 상태·정렬·필터), config(환경변수)
├── hooks/        useCurrentLocation, useNearbyToilets(목록 상태)
└── types/        서버와 주고받는 데이터 모양 (초안)
```

## 서버와 연결할 때

1. `.env` 의 `EXPO_PUBLIC_API_BASE_URL` 에 서버 주소를 적습니다. (예: `http://localhost:8080`)
2. 웹은 브라우저가 서버를 직접 호출하므로 **백엔드의 CORS 설정(BE-11)에서 `http://localhost:8081` 을 허용**해야 합니다.
3. 주소와 응답 모양은 `src/services/api.ts`, `src/types/toilet.ts` 의 초안입니다. API 명세 합의(COM-04) 후 맞춥니다.

## 팀과 상의가 필요한 것

- 라이브러리: `react-dom`, `react-native-web`, `@expo/metro-runtime` (Expo 를 웹에서 실행하는 데 필요)
- 지도: 지금은 Leaflet + OpenStreetMap 을 CDN 에서 불러옵니다. 카카오·네이버 지도로 정해지면 `components/ToiletMap.tsx`, `services/leaflet.ts` 만 바꾸면 됩니다.

## 시안과 다르거나 확인이 필요한 부분

- 상태: 시안의 3종(이용 가능·점검 중·운영 중지) 외에 **운영 종료**(운영시간 밖)와 **시간 확인 필요**(운영시간을 해석할 수 없음)를 추가했습니다.
- 정렬: "가까운 순 · 이용 가능 우선"을 이용 가능한 곳 먼저, 그다음 가까운 순으로 구현했습니다.
- 필터: 시안의 “운영시간 확인” 필터는 의미가 불분명해 만들지 않았고, 남녀 공용 필터는 시안에 없어 넣지 않았습니다. 필터는 지금 앱에서 거르며, 서버 조회 조건으로 바꾸는 것은 4주차(FE-11)입니다.
- 검색: 이미 불러온 목록에서 이름·주소로 거릅니다. 서버 검색 API 가 필요한지는 확인이 필요합니다.
- 도보 시간: 거리를 분속 80m 로 나눈 값입니다.
- 지도 위 주소 칩: 주소 변환(역지오코딩)이 없어 “내 위치 기준” 같은 기준 위치 설명으로 대신했습니다.
- 아직 없음: 사진 업로드·북마크·로그인·관리자 화면, 정보 오류 신고(버튼은 안내만 표시).

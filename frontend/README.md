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
| `/#/` | 주변 화장실 (목록 · 지도 · 상세 · 필터 · 길찾기 · 오류 신고) | 3주차 구현, 4주차 보강 |
| `/#/report` | 사용자 제보 — 화장실 고르기 | 4주차 구현 |
| `/#/report?id=화장실ID` | 사용자 제보 — 입력과 전송 | 4주차 구현 |
| `/#/my-reports` | 내 제보 | 준비 중 (로그인·사용자 식별 방식 확정 후) |

주소 뒤의 `?id=` 처럼 화면에 값을 넘길 수 있습니다. (`navigation/routes.ts` 의 `routeWith`, `splitRoute`)

## 폴더 구조

```text
src/
├── components/   TopNav, ToiletListPanel, ToiletCard, ToiletMap, ToiletDetailPanel, StatusBadge, Chip,
│                 ChoiceGroup(선택형 입력), ErrorReportModal(오류 신고 창)
├── screens/      NearbyScreen(주변 화장실), ReportScreen(제보), ComingSoonScreen(준비 중)
├── navigation/   routes.ts(주소 → 화면 이동), AppRouter.tsx
├── services/     api(서버 호출), mockData(가짜 서버), location(위치), leaflet(지도 로딩),
│                 mapLink(길찾기·카카오맵 연동), toiletLogic(거리·운영 상태·정렬·필터), config(환경변수)
├── hooks/        useCurrentLocation, useNearbyToilets(목록 상태)
└── types/        서버와 주고받는 데이터 모양 (초안)
```

## 4주차에 추가한 것

| 체크리스트 | 내용 | 위치 |
|---|---|---|
| FE-11 조건 필터 | 장애인 화장실·기저귀 교환대·남녀 공용 선택을 조회 조건(`accessible`, `diaperTable`, `unisex`)으로 서버에 전달하고, 바뀌면 같은 위치로 다시 조회 | `services/api.ts`, `hooks/useNearbyToilets.tsx` |
| FE-12 제보 입력·전송 | 개방 여부(필수)·도어락·휴지·위생을 큰 버튼으로 선택, 한 줄 메모(선택), 전송 후 결과 안내. 중복 전송 방지 | `screens/ReportScreen.tsx` |
| FE-13 오류 신고 | 상세 화면의 ‘정보 오류 신고’ 버튼 → 사유 선택 + 설명(선택) 전송 | `components/ErrorReportModal.tsx` |
| FE-14 길찾기 | 휴대폰: 카카오맵 앱(URL Scheme) 먼저 → 앱이 없으면 웹 길찾기. PC: 웹 길찾기(새 탭, 팝업이 막히면 같은 탭). 내 위치를 알면 출발지로 전달 | `services/mapLink.ts` |
| UI-11 도어락 안내 | 상세 화면에 ‘일반에 개방된 화장실에 한해 제공’ 안내와 관리 주체의 ‘도어락 정보 삭제 요청’ 버튼 | `components/ToiletDetailPanel.tsx` |

- `.env` 의 서버 주소가 비어 있으면 샘플 서버(mock)가 필터·제보·오류 신고를 흉내 냅니다. 제보하면 해당 화장실의 상태·휴지·위생·최근 제보가 바로 바뀝니다. (새로고침하면 처음 상태로 돌아갑니다)
- ‘이용 가능’ 필터는 지금 시각에 따라 달라지므로 서버에 보내지 않고 화면에서 거릅니다.

## 서버와 연결할 때

1. `.env` 의 `EXPO_PUBLIC_API_BASE_URL` 에 서버 주소를 적습니다. (예: `http://localhost:8080`)
2. 웹은 브라우저가 서버를 직접 호출하므로 **백엔드의 CORS 설정(BE-11)에서 `http://localhost:8081` 을 허용**해야 합니다.
3. 주소와 응답 모양은 `src/services/api.ts`, `src/types/toilet.ts` 의 초안입니다. API 명세 합의(COM-04) 후 맞춥니다.
4. 4주차에 추가한 요청 (백엔드 BE-07·08·12·15·16·17 과 맞춰야 합니다)
   - `GET /api/toilets/nearby?lat=&lng=&radius=&accessible=true&diaperTable=true&unisex=true` (켜진 조건만 붙음)
   - `POST /api/toilets/{id}/reports` — 본문 `{ status, passcode, toiletPaper, hygiene, comment? }`, 응답 `{ id, createdAt }`
   - `POST /api/toilets/{id}/error-reports` — 본문 `{ reason, description? }`, 응답 `{ id, status }`
   - 오류는 `{ code, message }` 로 받아 `message` 를 화면에 보여 줍니다. 반복 제보 제한(BE-16)은 HTTP 429 로 오면 안내 문구를 보여 줍니다.

## 팀과 상의가 필요한 것

- 라이브러리: `react-dom`, `react-native-web`, `@expo/metro-runtime` (Expo 를 웹에서 실행하는 데 필요)
- 지도: 지금은 Leaflet + OpenStreetMap 을 CDN 에서 불러옵니다. 카카오·네이버 지도로 정해지면 `components/ToiletMap.tsx`, `services/leaflet.ts` 만 바꾸면 됩니다.

## 시안과 다르거나 확인이 필요한 부분

- 상태: 시안의 3종(이용 가능·점검 중·운영 중지) 외에 **운영 종료**(운영시간 밖)와 **시간 확인 필요**(운영시간을 해석할 수 없음)를 추가했습니다.
- 정렬: "가까운 순 · 이용 가능 우선"을 이용 가능한 곳 먼저, 그다음 가까운 순으로 구현했습니다.
- 필터: 시안의 “운영시간 확인” 필터는 의미가 불분명해 만들지 않았습니다. 남녀 공용 필터는 체크리스트(UI-08, FE-11)에 있어 4주차에 추가했고, 필터는 서버 조회 조건으로 전달합니다.
- 검색: 이미 불러온 목록에서 이름·주소로 거릅니다. 서버 검색 API 가 필요한지는 확인이 필요합니다.
- 도보 시간: 거리를 분속 80m 로 나눈 값입니다.
- 지도 위 주소 칩: 주소 변환(역지오코딩)이 없어 “내 위치 기준” 같은 기준 위치 설명으로 대신했습니다.
- 아직 없음: 사진 업로드·북마크·로그인·관리자 화면, 내 제보 화면.

## 4주차에 정한 것 · 팀 확인이 필요한 부분

- **필드 추가(백엔드 확인)**: `Toilet.isUnisex`(남녀 공용), `Toilet.hygiene`(위생, 최근 제보 기준·선택). 이름과 값은 docs/api 명세에 맞춰 고칩니다.
- **제보 항목**: 체크리스트 UI-07 대로 개방 여부·도어락·휴지·위생을 선택 방식으로 받습니다. 개방 여부 값은 3주차의 상태값(이용 가능/점검 중/운영 중지)을 그대로 씁니다. UI-09 의 ‘개방/폐쇄/확인 안 됨’ 이름이 확정되면 `ReportScreen.tsx` 의 `STATUS_OPTIONS` 만 바꾸면 됩니다.
- **도어락**: 비밀번호 값 자체는 입력·표시하지 않고 ‘필요한지’만 다룹니다. 값까지 다루려면 API 필드와 개인정보·악용 문제를 먼저 정해야 합니다.
- **도어락 정보 삭제 요청(UI-11, BE-17)**: 관리 주체가 별도 연락처 없이 앱에서 요청하도록 오류 신고의 사유(`DOORLOCK_REMOVAL`)로 받습니다. 백엔드가 이 사유를 받으면 도어락 정보를 삭제하는 방식으로 맞춰야 하고, 다른 방식(이메일 등)이면 `ErrorReportModal.tsx`, `ToiletDetailPanel.tsx` 의 안내 문구를 바꿉니다.
- **카카오맵 앱 연동**: URL Scheme(`kakaomap://route?sp=&ep=&by=FOOT`)은 실제 휴대폰에서 확인이 필요합니다. (FE-16 실기기 테스트에서 점검)
- **UI-10(빈 상태·오류 상태 화면)**: 제보·신고·길찾기에서 필요한 오류·로딩 표시와 필터 결과 없음 안내까지만 반영했습니다. 모든 화면 적용은 FE-15(12월 1주차)에서 합니다.

# 📱 Open Toilet Finder - Frontend (React Native & Expo)

개방화장실 실시간 정보 공유 및 내비게이션 플랫폼의 모바일 클라이언트 앱입니다.

---

## 🛠️ 기술 스택

* **Framework**: React Native (Expo SDK 50)
* **Language**: TypeScript
* **Navigation**: React Navigation (Stack, Bottom Tabs)
* **Location**: Expo Location (GPS 위경도 수집)
* **Network**: Axios
* **External Maps**: 카카오맵 / 네이버 지도 URL Scheme 딥링크 연동

---

## 📂 폴더 구조

```text
frontend/
├── assets/          # 앱 아이콘, 스플래시 화면, 지도 마커 이미지
├── src/
│   ├── components/  # 공통 컴포넌트 (버튼, 카드, 모달, 필터 칩)
│   ├── screens/     # 메인 화면 (지도, 상세화면, 제보 등록, 오류 신고)
│   ├── navigation/  # 네비게이션 스택 설정
│   ├── services/    # 백엔드 REST API 통신 및 외부 지도 딥링크
│   ├── hooks/       # 위치 권한 및 GPS 추적 커스텀 훅
│   └── types/       # TypeScript 공통 인터페이스 (화장실, 제보 등)
├── app.json         # Expo 환경설정 (권한, 번들 ID 등)
├── package.json     # 의존성 패키지 목록
└── tsconfig.json    # TypeScript 설정
```

---

## 🚀 빠른 시작 가이드

### 1. 패키지 설치
```bash
cd frontend
npm install
```

### 2. 로컬 개발 서버 실행
```bash
npx expo start
```
* 터미널에 나타나는 QR 코드를 스마트폰(Expo Go 앱)으로 스캔하여 실시간 확인 가능합니다.
* 또는 `a` 키를 눌러 안드로이드 에뮬레이터에서 실행할 수 있습니다.

---

## 🔗 백엔드 API 연동 주의사항
* 안드로이드 에뮬레이터에서 `localhost:8080` 접근 시: `http://10.0.2.2:8080`을 사용해야 합니다.
* 실제 스마트폰 기기에서 테스트할 때는 컴퓨터와 스마트폰이 같은 Wi-Fi에 연결되어 있어야 하며, 컴퓨터의 로컬 IP(예: `http://192.168.0.x:8080`)로 요청해야 합니다.

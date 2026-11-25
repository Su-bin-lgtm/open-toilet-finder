# OpenToilet Web

React, TypeScript, Vite 기반의 웹 프론트엔드입니다. 기존 `backend/` 및 Expo `frontend/` 프로젝트와 분리되어 있습니다.

## 실행

```powershell
npm install
npm run dev
```

기본 API 주소는 `http://localhost:8080/api/v1`입니다. 다른 주소를 사용한다면 `.env.example`을 복사해 `.env.local`을 만들고 `VITE_API_BASE_URL`을 설정하세요. 브라우저 번들에 DB 비밀번호나 서버 비밀 키를 넣지 마세요.

## 검사 및 빌드

```powershell
npm run typecheck
npm run build
npm run preview
```

검색과 상세 페이지는 실제 백엔드 응답을 사용합니다. API 연결이 안 되면 연결 오류를 표시하며 임의의 샘플 데이터는 보여주지 않습니다. 지도 API, 로그인, 제보 제출, 카메라 및 YOLOv8 연동은 아직 구현하지 않았습니다.

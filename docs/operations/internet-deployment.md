# Open Toilet Finder 인터넷 배포 준비

이 문서는 Render의 정적 사이트 + Spring Boot Docker 서비스 구성에 맞춘 준비 안내입니다. 저장소의 `render.yaml`은 Blueprint 초안이며, 이 작업에서는 계정을 연결하거나 서비스를 생성·배포하지 않았습니다.

## 구성

- 웹: Render Static Site (`web/`, Vite `dist/` 산출물)
- API: Render Web Service (`backend/Dockerfile`, Java 21)
- DB: 별도 호스팅 MySQL. Render의 MySQL은 직접 운영하는 Docker 기반 private service이며 관리형 DB가 아니므로 백업·업그레이드 책임이 필요합니다.
- 업로드 이미지: API 서비스의 영구 디스크(`/var/data/images`)

`render.yaml`의 SPA rewrite가 `/report`, `/my-reports`, `/admin/reports`, `/toilets/:id` 같은 직접 진입과 새로고침을 `/index.html`로 전달합니다. 정적 사이트의 `VITE_API_BASE_URL`에는 배포된 API 주소의 `/api/v1`까지 포함합니다.

## 배포 환경변수

Render Dashboard의 API 서비스에 설정합니다. 실제 값은 이 저장소에 기록하지 않습니다.

- `DB_URL`: 새로 만든 운영용 MySQL 주소. 로컬 `open_toilet` 또는 `open_toilet_devtest`를 공개하거나 재사용하지 않습니다.
- `DB_USERNAME`, `DB_PASSWORD`: 배포 DB 전용 계정
- `CORS_ALLOWED_ORIGINS`: 웹 사이트의 정확한 HTTPS origin(예: `https://<웹서비스 도메인>`). 여러 origin은 쉼표로 구분합니다.
- `ADMIN_USERNAME`, `ADMIN_PASSWORD`: 관리자 기능을 사용할 경우 설정
- `TOILET_IMAGE_STORAGE_DIR`: `/var/data/images` (Blueprint 기본값)

웹 정적 사이트에는 다음을 설정합니다.

- `VITE_API_BASE_URL`: `https://<API 서비스 도메인>/api/v1`
- `VITE_NAVER_MAP_CLIENT_ID`: 브라우저에 공개되는 Web Dynamic Map Client ID. 네이버 콘솔에는 실제 웹 도메인을 등록하고, Client Secret은 넣지 않습니다.

Geocoding REST 기능을 운영에서 사용할 경우에만 백엔드 secret 환경변수로 `NAVER_GEOCODING_CLIENT_ID`, `NAVER_GEOCODING_CLIENT_SECRET`을 등록합니다. 프론트엔드에는 절대 두지 않습니다.

## 안전한 첫 배포 순서

1. 운영용 MySQL 호스팅과 백업 정책을 별도로 결정하고 새 운영 DB를 만듭니다. 로컬 DB는 이 과정에서 접속·변경하지 않습니다.
2. 운영 DB에 적용할 스키마 마이그레이션과 데이터 반입 범위를 검토한 후 별도 백업·복구 시험을 합니다. 이 저장소 준비 단계에서는 DB 생성·마이그레이션·데이터 이전을 하지 않았습니다.
3. Render에서 Blueprint를 검토하고 서비스별 secret 값을 직접 입력합니다. Blueprint 자동 배포는 꺼져 있으므로 서비스 생성/배포 전 각 설정과 비용을 확인합니다.
4. API 서비스가 운영 DB에 연결되고 `ddl-auto=validate`로 기동하는지 확인합니다. Seeder와 시작 시/일일 공공데이터 동기화는 prod 프로필에서 꺼져 있습니다.
5. API 배포 주소를 웹의 `VITE_API_BASE_URL`에 등록하고 프론트엔드를 빌드·배포합니다.
6. API CORS origin에 웹의 HTTPS origin만 허용하고, 관리자·회원·이미지 접근 권한 및 DB 백업/복구를 점검합니다.

## 제약과 비용 참고 (USD, 세금·초과 사용료 별도)

- Render 정적 사이트는 무료입니다.
- Render의 무료 API 서비스는 15분 유휴 후 sleep하고, 다시 요청할 때 약 1분 깨우기가 걸릴 수 있으며 파일시스템이 영구 저장되지 않습니다. 이 프로젝트는 API 상시 응답과 업로드 이미지 보존이 필요하므로 운영 서비스에는 무료 API 인스턴스를 권하지 않습니다.
- 현재 Render 요금표상 API의 1 CPU / 2 GB 인스턴스는 약 `$25/월`; 최소 유료 0.5 CPU / 512 MB는 `$7/월`입니다. Spring Boot와 이미지 요청의 메모리 여유를 위해 Blueprint는 1 CPU / 2 GB를 선택했습니다.
- Render의 self-hosted MySQL private service는 `$7/월`부터이며, 영구 디스크는 `$0.25/GB/월`부터입니다. API 1 CPU/2 GB + MySQL 최소 인스턴스 + 1 GB API 이미지 디스크 + 1 GB DB 디스크로 잡으면 대략 `$32.50/월`부터이며, 트래픽·추가 디스크·백업 저장 비용은 별도입니다. Render MySQL은 직접 관리하는 컨테이너이지 관리형 MySQL 상품이 아닙니다.
- 무료 정적 웹사이트와 외부의 관리형 MySQL 조합도 가능하지만, DB 제공자별 비용·백업·네트워크 허용 목록·MySQL 호환성을 별도로 확인해야 합니다.

## 아직 배포 전에 해결할 일

- 운영 MySQL 공급자/지역, 운영 DB 이름 및 접속 허용 네트워크 결정
- 기존 로컬 데이터 중 운영에 옮길 데이터의 출처·라이선스·개인정보 검토
- 신규 운영 DB용 마이그레이션 적용 및 복구 리허설
- Render 계정/저장소 연결과 실제 도메인 등록
- 이미지 디스크 용량, 백업·보존·삭제 정책 수립
- 계정·세션 비밀, 관리자 자격증명 및 로그/모니터링 검토
- 공개 서비스의 이용약관·개인정보 처리방침 준비

외부 공급자 가격과 무료 등급은 바뀔 수 있습니다. 실제 생성 전 공식 요금표와 배포 화면에서 다시 확인하세요.

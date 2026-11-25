# 임시 인터넷 공유 (Cloudflare Quick Tunnel)

이 방식은 로컬 개발 DB를 사용하는 임시 시연용입니다. 실행 시 웹/API가 공개 인터넷에서 접근 가능해집니다. 이 안내를 읽고 공유 범위를 정한 뒤 사용자가 직접 터널 명령을 실행해야 합니다. 이 작업에서는 터널을 시작하지 않았습니다.

## 구성

- 외부 공개: Vite Preview 정적 빌드 (`127.0.0.1:5174`; 기존 5173 실행 환경과 충돌을 피함)
- 비공개 유지: Spring Boot (`127.0.0.1:8080`)와 MySQL (`127.0.0.1:3306`)
- 브라우저 API 주소: 같은 공개 origin의 `/api/v1`; Preview 서버가 요청을 로컬 백엔드로 프록시
- 공개 대상에 Vite 개발 서버/HMR이 포함되지 않도록 `vite build --mode tunnel` 후 `vite preview`를 사용

## 한 번만 준비

1. `web/.env.tunnel.local`이 없을 때만 `web/.env.tunnel.example`을 복사합니다. 이미 파일이 있으면 덮어쓰지 말고 API 기본 주소가 `/api/v1`인지 확인합니다. 이 로컬 파일은 Git에서 제외됩니다.
2. `web/.env.local`의 네이버 지도 Client ID는 브라우저용 키라 페이지에서 보일 수 있습니다. Secret은 프론트엔드에 두지 마세요.
3. Cloudflare `cloudflared`가 설치되어 있어야 합니다. 이 문서에서는 설치하지 않습니다.

## 실행 순서

별도 PowerShell 창을 사용합니다. 백엔드는 기존 DB_USERNAME/DB_PASSWORD 환경변수를 쓰되, DB_URL은 프로세스 범위에서 개발 DB로 덮어씁니다. 비밀번호는 명령에 입력하거나 출력하지 마세요.

**1. 백엔드 창 — DB 확인 후 실행**

```powershell
cd "C:\Users\hsb06\Downloads\JAVA응용프로젝트\backend"
$env:DB_URL = 'jdbc:mysql://127.0.0.1:3306/open_toilet_devtest'
if (-not $env:DB_USERNAME -or -not $env:DB_PASSWORD) { throw 'DB_USERNAME/DB_PASSWORD가 이 PowerShell에 없습니다.' }
if ($env:DB_URL -ne 'jdbc:mysql://127.0.0.1:3306/open_toilet_devtest') { throw '허용되지 않은 DB입니다.' }
.\gradlew.bat bootRun --args="--spring.jpa.hibernate.ddl-auto=validate --app.seeder.initial-data.enabled=false --app.public-restroom.sync-on-start=false --app.public-restroom.daily-sync.enabled=false"
```

기동 로그에서 `open_toilet_devtest`를 사용하고 `ddl-auto=validate`인지 확인하세요. DB 또는 설정 오류가 있으면 터널을 시작하지 마세요.

**2. 웹 빌드 및 Preview 창**

```powershell
cd "C:\Users\hsb06\Downloads\JAVA응용프로젝트\web"
if (-not (Test-Path .env.tunnel.local)) { Copy-Item .env.tunnel.example .env.tunnel.local }
npm run build -- --mode tunnel
npm run preview -- --host 127.0.0.1 --port 5174 --strictPort
```

Preview에서 `http://127.0.0.1:5174/report`와 `http://127.0.0.1:5174/admin/reports`가 직접 열리는지 먼저 로컬에서 확인하세요. API 요청은 `/api` 프록시로 `127.0.0.1:8080`에 전달되고 MySQL 포트는 외부에 열지 않습니다.

**3. 공개 전에**

공개 링크는 누구나 접근 가능한 임시 URL입니다. 외부 사용자는 계정을 만들고 개발 DB에 제보를 저장하거나 이미지를 올릴 수 있습니다. 민감한/실사용자 데이터가 없는 개발 DB인지, 업로드 파일을 보존해도 되는지 확인한 뒤에만 진행하세요. 공개 시간은 짧게 유지하고 링크를 신뢰하는 테스트 참여자에게만 전달하세요. Cloudflare가 URL을 출력하는 다음 명령은 실행 즉시 공개를 시작하므로, 공개 직전에 사용자가 직접 실행해야 합니다.

```powershell
cloudflared tunnel --url http://127.0.0.1:5174
```

터미널에 표시되는 `https://….trycloudflare.com` 주소가 임시 링크입니다. 백엔드 8080이나 MySQL 3306용 터널은 별도로 만들지 마세요.

## 지도와 인증 제한

Naver Maps Web Dynamic Map 키는 브라우저에서 사용되므로 비밀키가 아닙니다. 그래도 도메인 허용목록을 확인해야 합니다. Quick Tunnel 주소는 매번 바뀔 수 있어 지도 인증이 실패할 수 있습니다. 네이버 콘솔의 Web 서비스 URL은 포트와 경로를 제외한 도메인만 등록해야 하며, Quick Tunnel의 임의 하위 도메인을 허용하도록 범위를 넓히면 키가 사용될 수 있는 사이트 범위도 넓어집니다. 기존 키 설정을 변경하기 전에 허용 범위를 검토하세요. 지도 타일 오류가 나도 검색/API가 작동할 수 있습니다.

백엔드의 기존 인증/권한은 그대로 유지합니다. 관리자 자격증명을 링크와 함께 공유하지 마세요. 로그인·가입·제보·이미지 업로드 API가 공개되므로, 남용 방지용 속도 제한은 현재 준비되어 있지 않은 것으로 간주하고 임시 테스트에만 사용하세요.

## 종료

1. 터널 PowerShell에서 `Ctrl+C`를 눌러 외부 공개를 먼저 끝냅니다.
2. Preview 창에서 `Ctrl+C`를 누릅니다.
3. 백엔드 창에서 `Ctrl+C`를 누릅니다.

터널 프로세스가 종료되면 임시 URL 접근은 끊깁니다. 생성된 계정, 제보, 이미지 파일은 개발 DB와 로컬 이미지 저장소에 남을 수 있습니다. 이 문서는 삭제 절차를 수행하지 않습니다.

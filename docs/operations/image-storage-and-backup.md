# 이미지 파일 및 데이터 백업 운영 지침

## 저장 구조

- 이미지 메타데이터는 `report_image` 테이블에 저장하고, 바이트는 `TOILET_IMAGE_STORAGE_DIR`이 지정한 로컬 디렉터리에 저장한다.
- 환경 변수가 없으면 `${user.home}/.open-toilet-finder/images`를 사용한다. `LocalImageStorage`가 첫 저장 때 디렉터리를 생성한다.
- 파일명은 서버가 생성한 UUID 키이며, 업로드 원본 파일명이나 파일 경로를 API에 노출하지 않는다.
- 배포 시 환경 변수는 코드나 Git에 넣지 않는다. 애플리케이션 계정만 저장 디렉터리에 접근하도록 OS ACL을 설정하고, 웹 서버의 정적 파일 루트로 공개하지 않는다.
- 컨테이너나 임시 VM을 사용한다면 저장 디렉터리를 영구 볼륨에 마운트한다. 컨테이너 내부 임시 경로만 사용하면 재배포 후 이미지가 보존되지 않는다.

## 백업 및 복구

DB 메타데이터와 이미지 디렉터리는 한 쌍으로 백업한다. 백업 시점 전후에 이미지 업로드/삭제를 잠시 중지하거나, DB와 파일 시스템을 같은 시점으로 캡처할 수 있는 스냅샷을 사용한다. 파일만 또는 DB만 복구하면 참조가 끊긴 메타데이터/파일이 생길 수 있다.

Windows PowerShell 예시는 개발 데이터베이스 `open_toilet_devtest` 전용이다. 백업 디렉터리는 접근이 제한된 별도 드라이브를 사용하고, 실제 비밀번호는 명령행에 넣지 않는다. `-p`가 비밀번호를 대화형으로 요청한다.

```powershell
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$backupRoot = 'D:\OpenToiletBackups'
$dbUrl = $env:DB_URL
if ($dbUrl -notmatch '^jdbc:mysql://127\.0\.0\.1:3306/open_toilet_devtest(?:\?|$)') {
  throw 'DB_URL must point to the local open_toilet_devtest database for this example'
}
if ([string]::IsNullOrWhiteSpace($env:DB_USERNAME)) { throw 'DB_USERNAME is not set' }
$null = New-Item -ItemType Directory -Path $backupRoot -Force
$imageDir = $env:TOILET_IMAGE_STORAGE_DIR
if ([string]::IsNullOrWhiteSpace($imageDir)) {
  $imageDir = Join-Path $env:USERPROFILE '.open-toilet-finder\images'
}
$dbFile = Join-Path $backupRoot "open_toilet_devtest-$stamp.sql"
$imageBackup = Join-Path $backupRoot "images-$stamp"
New-Item -ItemType Directory -Path $imageBackup -Force | Out-Null
mysqldump --host=127.0.0.1 --port=3306 --user=$env:DB_USERNAME --single-transaction --routines --triggers --result-file=$dbFile -p open_toilet_devtest
if ($LASTEXITCODE -ne 0) { throw 'DB backup failed' }
if (-not (Test-Path -LiteralPath $imageDir)) { New-Item -ItemType Directory -Path $imageDir -Force | Out-Null }
robocopy $imageDir $imageBackup /E /COPY:DAT /R:2 /W:2
if ($LASTEXITCODE -ge 8) { throw 'Image backup failed' }
```

위 예시는 DB URL이 실제로 `127.0.0.1:3306`의 개발 DB를 가리키는지 먼저 확인한 뒤 사용한다. 운영 DB에서는 실행하지 않는다. 운영 백업은 운영 DB 이름, 자격 증명 저장소, 암호화 위치, 보존 주기를 운영 담당자가 확인한 후 별도 승인된 절차로 수행한다.

복구는 백업 파일을 기존 DB에 바로 덮어쓰지 말고, 격리된 복구 DB와 별도 이미지 디렉터리로 먼저 복원한다. 복원 후 행 수, `report_image.storage_key`의 파일 존재 여부, API 접근 권한을 검증하고 승인된 전환 절차를 거친다. 운영 DB 교체나 복구 명령은 이 프로젝트의 개발 작업에서 실행하지 않는다.

개발 DB 복구 예시는 아래처럼 별도의 복구 DB를 먼저 만들고, 같은 시각의 이미지 백업을 별도 경로로 복사한다. 복구 DB가 이미 있으면 덮어쓰지 말고 다른 이름을 고른다. 아래는 운영 DB에 사용할 명령이 아니다.

```powershell
$recoveryDb = 'open_toilet_devtest_recovery'
$imageBackup = 'D:\OpenToiletBackups\images-<backup-timestamp>'
$recoveryImages = 'D:\OpenToiletRecovery\images'
mysql --host=127.0.0.1 --port=3306 --user=$env:DB_USERNAME -p -e "CREATE DATABASE $recoveryDb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
if ($LASTEXITCODE -ne 0) { throw 'Create a new, isolated recovery database before continuing' }
Get-Content -LiteralPath 'D:\OpenToiletBackups\open_toilet_devtest-<backup-timestamp>.sql' -Raw |
  mysql --host=127.0.0.1 --port=3306 --user=$env:DB_USERNAME -p $recoveryDb
if ($LASTEXITCODE -ne 0) { throw 'DB restore failed' }
New-Item -ItemType Directory -Path $recoveryImages -Force | Out-Null
robocopy $imageBackup $recoveryImages /E /COPY:DAT /R:2 /W:2
if ($LASTEXITCODE -ge 8) { throw 'Image restore failed' }
```

`<backup-timestamp>`는 실제 백업 시각으로 바꾸고, 복구 DB에 `DB_URL`을 지정한 별도 프로세스에서 `ddl-auto=validate`로 확인한다. 사용자 서비스의 연결 주소를 복구 대상으로 바꾸기 전에 복구 DB·이미지 경로의 정합성을 점검한다.

## 보존·삭제·용량 정책

- 현재 API에는 제보/이미지 삭제 기능이나 자동 보존기간 작업이 없다. 따라서 이미지 및 메타데이터는 명시적인 보존 정책과 승인된 삭제 도구가 마련될 때까지 자동 삭제하지 않는다.
- `report_image`는 두 제보 테이블을 외래 키로 참조한다. 이미지 메타데이터가 연결된 제보 삭제는 기본 FK 동작상 제한된다. 제보 삭제 기능을 추가한다면 DB 행과 파일을 단순히 한 트랜잭션에서 함께 지우려 하지 말고, 삭제 대기(outbox) 기록, 재시도 가능한 파일 삭제, 감사 로그를 포함한 절차를 먼저 설계한다.
- 프로세스 강제 종료 등으로 DB 메타데이터 없이 남은 파일이 생길 수 있다. 자동 정리 작업은 현재 없다. 정리 전 DB의 모든 `storage_key`와 디렉터리 파일을 대조하고, 미참조 파일은 백업 후 유예기간을 둔 다음 운영자 승인으로 삭제한다.
- 정기적으로 저장 디렉터리 크기와 여유 공간을 모니터링한다. 업로드 상한은 파일 10MB, 이미지 해상도 4천만 픽셀이다. 용량 경보 임계치와 백업 보존 주기는 배포 환경의 용량 계획에 따라 정한다.

```powershell
$imageDir = $env:TOILET_IMAGE_STORAGE_DIR
if ([string]::IsNullOrWhiteSpace($imageDir)) {
  $imageDir = Join-Path $env:USERPROFILE '.open-toilet-finder\images'
}
Get-ChildItem -LiteralPath $imageDir -File -Recurse -ErrorAction SilentlyContinue |
  Measure-Object -Property Length -Sum
```

## 향후 스토리지 교체

서비스는 `ImageStorage` 인터페이스를 통해 저장·읽기·삭제를 수행하고 현재 구현체는 `LocalImageStorage`다. 클라우드 스토리지를 도입할 때는 인터페이스 구현과 설정만 교체하고, API의 불투명 파일 키와 DB 메타데이터 모델은 유지한다. 클라우드 공개 URL을 직접 저장하지 말고 권한 확인을 거치는 API 또는 짧은 만료의 서명 URL을 사용한다.

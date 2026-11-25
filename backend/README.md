# Open Toilet Finder - Backend (Spring Boot & Java 21)

이 폴더는 **개방화장실 실시간 정보 공유 및 내비게이션 플랫폼**의 백엔드 REST API 서버 프로젝트입니다.

---

## 1. 기술 스택 & 요구사항

* **Java**: Java 21 LTS
* **Framework**: Spring Boot 3.2.5
* **Build Tool**: Gradle
* **ORM**: Spring Data JPA (Hibernate)
* **Database**: MySQL 8.0 이상
* **개발 도구**: Visual Studio Code (또는 IntelliJ IDEA)

---

## 2. 패키지 구조 및 역할

```text
backend/src/main/java/com/opentoilet/
├── OpenToiletApplication.java # Spring Boot 시작점 (main 메서드)
├── config/                    # 웹 환경설정 (CORS 설정, WebMvcConfigurer 등)
├── controller/                # REST API 엔드포인트 계층 (HTTP 요청 매핑)
├── service/                   # 비즈니스 로직 계층 (검색 계산, 제보 신뢰도 검증)
├── repository/                # 데이터 접근 계층 (Spring Data JPA 인터페이스)
├── entity/                    # MySQL 테이블 매핑 JPA 엔티티 객체
└── dto/                       # 요청(Request) 및 응답(Response) 전송 객체
```

---

## 3. 로컬 개발 환경 설정 가이드

### 1) MySQL 데이터베이스 생성
MySQL 워크벤치 또는 터미널에서 로컬 데이터베이스를 생성합니다:
```sql
CREATE DATABASE open_toilet DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2) 로컬 설정 파일 생성 (application-local.yml)
1. `src/main/resources/application-local.yml.template` 파일을 복사합니다.
2. 같은 디렉토리에 `application-local.yml` 이름으로 저장합니다.
3. 본인의 로컬 MySQL 비밀번호를 입력합니다.
> **주의**: `application-local.yml`은 `.gitignore`에 등록되어 있으므로 Git에 커밋되지 않습니다.

### 3) VS Code에서 실행하기
1. VS Code에서 `Extension Pack for Java` 및 `Spring Boot Extension Pack`이 설치되어 있는지 확인합니다.
2. `OpenToiletApplication.java` 파일을 열고 상단의 Run 버튼을 클릭하거나 `F5`를 누릅니다.
3. 터미널에서 Gradle로 직접 실행할 수도 있습니다:
   ```bash
   ./gradlew bootRun
   ```
4. 정상 실행 시 `http://localhost:8080` 포트로 서버가 기동됩니다.

---

## 4. 코딩 컨벤션 & 가이드

1. **3계층 아키텍처 준수**:
   * Controller는 오직 요청 수신 및 DTO 응답만 담당합니다. 비즈니스 계산은 Service에 작성하세요.
   * Entity 객체를 직접 Controller의 반환값으로 쓰지 말고, 항상 DTO로 변환하여 반환합니다.
2. **명확한 주석 작성**:
   * 각 메서드와 클래스 상단에 어떤 동작을 수행하는지 간결한 주석을 달아주세요.
3. **Lombok 활용**:
   * `@Getter`, `@NoArgsConstructor(access = AccessLevel.PROTECTED)`, `@Builder` 등을 활용하여 불필요한 반복 코드를 줄입니다.

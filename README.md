# 🚻 Open Toilet Finder (개방화장실 실시간 정보 공유 및 내비게이션 플랫폼)

공공데이터와 사용자 실시간 제보를 결합하여, 내 주변 개방화장실의 정확한 위치, 개방 여부, 위생 상태 및 편의시설 정보를 제공하는 모바일 서비스 플랫폼입니다.

---

## 📌 1. 프로젝트 개요

* **프로젝트명**: `open-toilet-finder`
* **국문명**: 개방화장실 실시간 정보 공유 및 내비게이션 플랫폼
* **개발 배경 및 목적**:
  * 외출 중 급하게 화장실을 찾을 때 개방 여부(잠김 여부, 도어락 번호)나 위생 상태(휴지 유무)를 사전에 확인하기 어려운 문제를 해결합니다.
  * 공공데이터 포털의 전국 공중화장실 데이터베이스를 기초로 구축하되, 변경/폐쇄된 정보나 실시간 상태를 사용자가 직접 제보하고 갱신할 수 있는 양방향 플랫폼을 지향합니다.
  * 장애인 화장실, 기저귀 교환대 유무 등 사회적 약자를 위한 상세 편의시설 필터링을 제공합니다.

---

## 🛠️ 2. 기술 스택

### Frontend
* **Core Framework**: React Native (Expo)
* **Language**: TypeScript
* **Navigation**: React Navigation (Native Stack / Bottom Tabs)
* **API Client**: Axios

### Backend
* **Core Framework**: Spring Boot 3.x
* **Language**: Java 21
* **Data Access**: Spring Data JPA, Hibernate
* **Database**: MySQL 8.x
* **Documentation**: OpenAPI (Swagger)

### Collaboration & Environment
* **VCS**: Git, GitHub ([Repository](https://github.com/Su-bin-lgtm/open-toilet-finder))
* **Editor**: Visual Studio Code (VS Code)
* **Workflow**: Git Feature Branch & Pull Request (PR)

---

## 📂 3. 프로젝트 전체 구조

```text
open-toilet-finder/
├── frontend/                      # [React Native / Expo 모바일 앱]
│   ├── src/
│   │   ├── components/            # 공통 재사용 UI 컴포넌트
│   │   ├── screens/               # 화면 단위 컴포넌트 (지도, 상세, 제보 등)
│   │   ├── navigation/            # 네비게이션 스택 및 라우터 설정
│   │   ├── services/              # 백엔드 API 통신 모듈
│   │   ├── hooks/                 # 커스텀 React Hooks (위치 추적 등)
│   │   └── types/                 # TypeScript 인터페이스/타입
│   ├── assets/                    # 지도 마커, 아이콘, 이미지
│   └── README.md                  # 프론트엔드 상세 가이드
│
├── backend/                       # [Spring Boot / Java 21 백엔드 API 서버]
│   ├── src/main/java/com/opentoilet/
│   │   ├── controller/            # REST API 컨트롤러 계층
│   │   ├── service/               # 비즈니스 로직 계층
│   │   ├── repository/            # 데이터베이스 접근(JPA) 계층
│   │   ├── entity/                # JPA 엔티티 (데이터베이스 테이블 매핑)
│   │   ├── dto/                   # 계층 간 데이터 전송 객체 (Request/Response)
│   │   ├── config/                # CORS, Swagger, Security 등 환경 설정
│   │   └── OpenToiletApplication.java # Spring Boot 애플리케이션 진입점
│   ├── src/main/resources/
│   │   └── application.yml        # 애플리케이션 설정 파일
│   └── README.md                  # 백엔드 상세 가이드
│
├── data/                          # [공공데이터 수집 및 전처리]
│   ├── raw/                       # 공공데이터 원본 파일 (CSV, JSON 등)
│   ├── processed/                 # DB 적재용 정제 데이터
│   └── README.md                  # 데이터 명세 및 적재 가이드
│
├── docs/                          # [프로젝트 기획 및 설계 문서]
│   ├── requirements/              # 요구사항 명세서
│   ├── design/                    # ERD 및 UI/UX 화면 흐름 설계
│   ├── api/                       # REST API 상세 명세서
│   └── README.md                  # 문서 목록 안내
│
├── tests/                         # [통합 및 E2E 테스트]
│   └── README.md                  # 테스트 전략 및 실행 안내
│
├── .gitignore                     # Git 형상관리 제외 설정 (보안 키, 빌드물 등)
└── README.md                      # 프로젝트 메인 안내 문서
```

---

## 🚀 4. 주요 기능

1. **현재 위치 기반 주변 화장실 탐색**: GPS 기반 반경(기본 500m~1km) 내 화장실 마커 지도 표시
2. **화장실 위치 및 상세 정보 조회**: 주소, 층수, 남녀 분리 여부, 변기 수 등 상세 안내
3. **개방 여부 및 운영 시간 표시**: 24시간 개방 여부, 정기 휴무일, 야간 개방 시간 안내
4. **도어락 정보 및 출입 안내**: 도어락 설치 여부, 비밀번호 힌트/상가 영수증 확인 필요 여부
5. **위생 상태 및 휴지 유무 제보**: 사용자가 현장에서 "휴지 있음/없음", "위생 상태(청결/보통/불량)" 1초 제보
6. **편의시설 맞춤 필터**: 장애인 전용 화장실, 유아용 변기, 기저귀 교환대 필터링
7. **사용자 신규 화장실 제보**: 공공데이터에 누락된 민간 개방화장실 직접 추가
8. **오류 신고**: 화장실 폐쇄, 위치 불일치, 비밀번호 변경 신고 및 검증
9. **외부 지도 앱 길찾기 연동**: 카카오맵, 네이버 지도, TMAP 딥링크를 통한 경로 안내

---

## 👥 5. 협업 규칙 & 보안 가이드

### 🌿 Git Branch 전략
* `main`: 배포 가능한 안정적인 최신 릴리스 브랜치
* `develop`: 기능 개발 통합 브랜치
* `feature/{frontend|backend}-{기능명}`: 단위 기능 작업 브랜치
  * 예: `feature/backend-toilet-api`, `feature/frontend-map-screen`
* 모든 기능은 Pull Request(PR)를 작성하여 코드 리뷰 후 병합합니다.

### 🔒 보안 및 환경 변수 보호
* **절대 API 키, DB 비밀번호, JWT 시크릿을 Git에 커밋하지 않습니다.**
* 데이터베이스 접속 정보는 환경 변수(`DB_URL`, `DB_USERNAME`, `DB_PASSWORD`) 또는 로컬 전용 설정 파일(`application-local.yml`)을 통해 관리하며, 이 파일들은 `.gitignore`에 등록되어 있습니다.

---

## 💻 6. VS Code 작업 가이드

1. **권장 확장 프로그램 (Extensions)**:
   * **Java**: `Extension Pack for Java` (Red Hat), `Spring Boot Extension Pack` (VMware)
   * **React Native**: `React Native Tools`, `ESLint`, `Prettier`
2. **인코딩 설정**: 모든 텍스트 파일은 `UTF-8` 형식을 준수합니다.


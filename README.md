# open-toilet-finder

개방화장실 실시간 정보 공유 및 내비게이션 플랫폼

공공데이터와 사용자 제보를 합쳐서 주변 개방화장실의 위치, 개방 여부, 위생 상태, 편의시설 정보를 보여 주는 모바일 앱입니다. 선문대학교 SW중심대학사업단 기업연계 프로젝트(2026학년도 2학기, 담당교수 이택)로 진행합니다.

## 만드는 이유

지도 앱에서 화장실 위치는 찾을 수 있지만, 가 보면 잠겨 있거나 휴지가 없는 경우가 많습니다. 개방 시간, 도어락 번호, 위생 상태를 가기 전에 확인할 수 있으면 헛걸음을 줄일 수 있습니다. 영유아를 데리고 다니는 보호자나 휠체어 이용자는 기저귀 교환대와 장애인 화장실 여부도 미리 알아야 합니다.

기본 위치 정보는 공공데이터포털의 개방화장실 표준데이터를 쓰고, 실제 현장 상태는 이용자가 직접 제보해서 갱신합니다.

## 기술 스택

| 구분 | 사용 기술 |
|---|---|
| 앱 | React Native, Expo, TypeScript |
| 서버 | Java 21, Spring Boot, Spring Web, Spring Data JPA |
| DB | MySQL |
| 빌드 | Maven |
| 협업 | GitHub (브랜치, Pull Request) |
| 에디터 | VS Code |

위 목록에 없는 라이브러리는 팀원과 상의한 뒤에 추가합니다.

## 폴더 구조

```text
open-toilet-finder/
├── frontend/          앱 (Expo + TypeScript)
│   ├── src/
│   │   ├── components/    재사용 UI
│   │   ├── screens/       화면 (지도, 목록, 상세, 제보)
│   │   ├── navigation/    화면 이동 설정
│   │   ├── services/      서버 호출, 위치, 지도앱 연동
│   │   ├── hooks/         커스텀 훅
│   │   └── types/         API 응답 타입
│   └── assets/
├── backend/           API 서버 (Spring Boot)
│   └── src/main/
│       ├── java/com/opentoilet/
│       │   ├── controller/    요청을 받는 API
│       │   ├── service/       실제 처리 로직
│       │   ├── repository/    DB 조회와 저장
│       │   ├── entity/        DB 테이블과 연결되는 클래스
│       │   ├── dto/           요청과 응답에 쓰는 객체
│       │   ├── config/        CORS 등 설정
│       │   └── OpenToiletApplication.java
│       └── resources/         설정 파일
├── data/
│   ├── raw/           공공데이터 원본
│   └── processed/     정제한 데이터
├── docs/
│   ├── requirements/  요구사항 정의서
│   ├── design/        구조도, ERD
│   └── api/           API 명세
├── tests/             통합 테스트
├── .gitignore
└── README.md
```

각 폴더에도 README.md가 있으니 자세한 내용은 그쪽을 봐 주세요.

## 주요 기능

1. 현재 위치 기준 주변 화장실 찾기
2. 화장실 위치와 상세 정보 보기
3. 개방 여부와 운영 시간 표시
4. 도어락 정보와 출입 방법 표시
5. 위생 상태와 휴지 유무 제보
6. 장애인 화장실, 기저귀 교환대 필터
7. 제보 등록과 최신 정보 반영
8. 잘못된 정보 오류 신고
9. 외부 지도 앱으로 길찾기 연결

## 협업 규칙

브랜치는 아래 세 가지로 나눕니다.

- `main`: 안정된 버전. 직접 푸시하지 않습니다.
- `develop`: 기능을 합치는

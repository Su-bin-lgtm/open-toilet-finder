# REST API 명세서 (API Specification)

본 문서는 프론트엔드(React Native)와 백엔드(Spring Boot) 간의 HTTP REST 통신 규격을 정의합니다.

* **기본 URL (Base URL)**: `http://localhost:8080/api/v1`
* **데이터 포맷**: `application/json; charset=UTF-8`

---

## 1. API 요약표

| 기능 | HTTP Method | Endpoint | 설명 |
| :--- | :--- | :--- | :--- |
| **주변 화장실 목록 조회** | `GET` | `/toilets/nearby` | 현재 GPS 좌표 기준 반경 내 화장실 조회 (필터 지원) |
| **화장실 키워드 검색** | `GET` | `/toilets/search` | 화장실 이름 또는 주소 키워드 텍스트 검색 |
| **화장실 상세 정보 조회** | `GET` | `/toilets/{id}` | 특정 화장실의 전체 편의시설 및 최근 제보 조회 |
| **신규 화장실 등록 제보** | `POST` | `/toilets` | 사용자가 발견한 미등록 개방화장실 등록 |
| **실시간 상태 제보 등록** | `POST` | `/toilets/{id}/reports` | 특정 화장실의 휴지, 위생 상태, 개방 여부 제보 |
| **오류 신고 접수** | `POST` | `/toilets/{id}/issues` | 폐쇄, 위치 오류 등 정보 오류 신고 |
| **오류 신고 상태 변경** | `PATCH` | `/toilets/issues/{id}/status` | 신고 처리 상태(확인중, 조치완료 등) 변경 |
| **오류 신고 목록 조회** | `GET` | `/toilets/issues` | 접수된 오류 신고 목록 조회 |
| **공공데이터 CSV 적재** | `POST` | `/admin/import-csv` | 표준 CSV 파일 업로드 및 DB 적재 |

---

## 2. 엔드포인트 상세 명세

### 1) 주변 화장실 목록 조회 (위치 기반 탐색)
* **Endpoint**: `GET /toilets/nearby`
* **Query Parameters**:
  * `lat` (required, double): 사용자 현재 위도 (예: 36.7987)
  * `lng` (required, double): 사용자 현재 경도 (예: 127.0751)
  * `radiusMeter` (optional, int): 검색 반경(미터), 기본값 `500`
  * `onlyOpen` (optional, boolean): 현재 개방 중인 곳만 필터링 (기본 false)
  * `hasDisabled` (optional, boolean): 장애인 화장실 보유 여부 (기본 false)
  * `hasDiaper` (optional, boolean): 기저귀 교환대 보유 여부 (기본 false)

* **Response (200 OK)**:
```json
[
  {
    "id": 101,
    "name": "아산시 배방읍 공중화장실",
    "address": "충청남도 아산시 배방읍 모산로 123",
    "latitude": 36.799120,
    "longitude": 127.076210,
    "distanceMeter": 120,
    "isOpenNow": true,
    "openTimeInfo": "24시간",
    "hasDisabledToilet": true,
    "hasDiaperTable": false,
    "hasTissue": true,
    "hygieneStatus": "CLEAN"
  }
]
```

---

### 2) 화장실 키워드 검색
* **Endpoint**: `GET /toilets/search`
* **Query Parameters**:
  * `keyword` (required, string): 검색어 (예: "선문대", "배방")
  * `lat` (optional, double): 사용자 현재 위도 (거리 계산용)
  * `lng` (optional, double): 사용자 현재 경도 (거리 계산용)

---

### 3) 화장실 상세 정보 조회
* **Endpoint**: `GET /toilets/{id}`
* **Path Variable**: `id` (화장실 ID)

* **Response (200 OK)**:
```json
{
  "id": 101,
  "name": "아산시 배방읍 공중화장실",
  "address": "충청남도 아산시 배방읍 모산로 123",
  "latitude": 36.799120,
  "longitude": 127.076210,
  "isOpenNow": true,
  "openTimeInfo": "24시간 상시 개방",
  "doorLockCode": null,
  "isUnisex": false,
  "maleWaterClosetCount": 3,
  "maleUrinalCount": 4,
  "femaleWaterClosetCount": 5,
  "hasDisabledToilet": true,
  "hasDiaperTable": false,
  "hasTissue": true,
  "hygieneStatus": "CLEAN",
  "emergencyBell": true,
  "managementAgency": "아산시청 환경보전과",
  "phoneNumber": "041-540-2472",
  "recentReports": [
    {
      "id": 45,
      "hasTissue": true,
      "hygieneStatus": "CLEAN",
      "isOpen": true,
      "comment": "휴지 넉넉하고 깨끗해요!",
      "createdAt": "2026-11-09T10:15:00"
    }
  ],
  "updatedAt": "2026-11-09T10:15:00"
}
```

---

### 4) 실시간 상태 제보 등록 (휴지/위생)
* **Endpoint**: `POST /toilets/{id}/reports`
* **Path Variable**: `id` (화장실 ID)
* **Request Body**:
```json
{
  "hasTissue": false,
  "hygieneStatus": "NORMAL",
  "isOpen": true,
  "doorLockCode": "1234*",
  "comment": "휴지는 떨어졌지만 문은 열려있습니다."
}
```
* **Response (201 Created)**:
```json
{
  "reportId": 46,
  "toiletId": 101,
  "message": "상태 제보가 성공적으로 등록되었습니다."
}
```

---

### 5) 화장실 정보 오류 신고
* **Endpoint**: `POST /toilets/{id}/issues`
* **Request Body**:
```json
{
  "issueType": "CLOSED",
  "content": "공사로 인해 철거되었습니다."
}
```
* **Response (201 Created)**:
```json
{
  "issueId": 12,
  "toiletId": 101,
  "status": "RECEIVED",
  "message": "신고가 접수되었습니다. 확인 후 반영하겠습니다."
}
```

---

## 3. 공통 에러 응답 규격

```json
{
  "timestamp": "2026-11-09T12:00:00",
  "status": 404,
  "error": "Not Found",
  "message": "해당 식별자의 화장실 정보를 찾을 수 없습니다."
}
```

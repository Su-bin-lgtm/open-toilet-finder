# 🧪 Tests Directory

본 폴더는 시스템 품질 보증을 위한 단위 테스트(Unit Test) 및 통합 테스트(Integration Test) 전략을 안내합니다.

---

## 🎯 테스트 전략

1. **백엔드 단위 및 통합 테스트**:
   * `backend/src/test/java/` 내에서 JUnit 5와 Mockito를 사용하여 구현합니다.
   * 주요 테스트 대상:
     * `ToiletServiceTest`: 위경도 기반 반경 거리 계산 정확도 검증
     * `ToiletControllerTest`: MockMvc를 활용한 API 엔드포인트 응답 규격 검증
     * `ReportValidationTest`: 제보 데이터 유효성 검사

2. **프론트엔드 컴포넌트 테스트**:
   * Jest 및 React Native Testing Library를 활용하여 핵심 컴포넌트(필터 칩, 화장실 카드 등) 렌더링 검증

3. **현장 시범 테스트 (PDF 계획서 반영)**:
   * 팀원 4인(진 꼬 꼬 아웅, 차현호, 한석규, 한수빈)이 선문대학교 캠퍼스 및 아산/천안 인근 개방화장실을 직접 방문하여 실시간 제보 및 길안내 연동 플로우를 교차 검증합니다.

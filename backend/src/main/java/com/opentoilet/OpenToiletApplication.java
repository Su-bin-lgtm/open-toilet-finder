package com.opentoilet;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * <h1>개방화장실 실시간 정보 공유 및 내비게이션 플랫폼 백엔드 진입점</h1>
 * <p>
 * 이 클래스는 Spring Boot 애플리케이션의 시작 클래스입니다.
 * main 메서드를 실행하면 내장 톰캣(Tomcat) 서버가 8080 포트에서 실행됩니다.
 * </p>
 *
 * <h3>계층(Layer) 구조 안내:</h3>
 * <ul>
 *   <li><b>controller:</b> 프론트엔드(React Native) 앱에서 들어오는 HTTP 요청을 받아 적절한 서비스로 연결합니다.</li>
 *   <li><b>service:</b> 실제 비즈니스 로직(거리 계산, 제보 신뢰도 검증 등)을 처리합니다.</li>
 *   <li><b>repository:</b> Spring Data JPA를 이용하여 MySQL 데이터베이스와 직접 통신합니다.</li>
 *   <li><b>entity:</b> MySQL의 테이블 구조와 1:1로 매핑되는 자바 객체입니다.</li>
 *   <li><b>dto:</b> 프론트엔드와 주고받는 데이터 형식(Request, Response)을 정의합니다.</li>
 *   <li><b>config:</b> CORS 설정(앱과의 통신 허용), 보안 등 환경 설정을 담당합니다.</li>
 * </ul>
 */
@SpringBootApplication
public class OpenToiletApplication {

    public static void main(String[] args) {
        // Spring Boot 애플리케이션 실행
        SpringApplication.run(OpenToiletApplication.class, args);
    }

}

package com.opentoilet.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * <h1>웹 및 CORS 설정 클래스</h1>
 * <p>
 * React Native(Expo) 앱이나 웹 브라우저에서 백엔드 API를 호출할 수 있도록
 * CORS(Cross-Origin Resource Sharing) 허용 정책을 설정합니다.
 * </p>
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**") // /api 로 시작하는 모든 엔드포인트에 적용
                .allowedOrigins("*")   // 개발 단계에서는 모든 도메인/앱에서의 요청을 허용
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .maxAge(3600);
    }
}

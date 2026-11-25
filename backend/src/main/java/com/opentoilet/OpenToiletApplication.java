package com.opentoilet;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

// 개방화장실 실시간 정보 공유 및 내비게이션 플랫폼 백엔드 진입점
@SpringBootApplication
public class OpenToiletApplication {

    public static void main(String[] args) {
        SpringApplication.run(OpenToiletApplication.class, args);
    }
}

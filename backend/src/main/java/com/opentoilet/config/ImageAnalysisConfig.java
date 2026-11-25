package com.opentoilet.config;

import com.opentoilet.service.ToiletImageAnalyzer;
import com.opentoilet.service.UnavailableToiletImageAnalyzer;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ImageAnalysisConfig {
    @Bean
    @ConditionalOnMissingBean(ToiletImageAnalyzer.class)
    ToiletImageAnalyzer unavailableToiletImageAnalyzer() {
        return new UnavailableToiletImageAnalyzer();
    }
}

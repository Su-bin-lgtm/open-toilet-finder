package com.opentoilet.config;

import com.opentoilet.service.PublicRestroomSyncService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.public-restroom.sync-on-start", havingValue = "true")
public class PublicRestroomSyncRunner implements ApplicationRunner {
    private final PublicRestroomSyncService syncService;

    @Override
    public void run(ApplicationArguments args) {
        try {
            PublicRestroomSyncService.SyncSummary result = syncService.synchronize();
            log.info("Public restroom sync completed: mode={}, total={}, pages={}, inserted={}, updated={}, skipped={}",
                    result.mode(), result.totalCount(), result.pages(), result.inserted(), result.updated(), result.skipped());
        } catch (RuntimeException e) {
            log.error("Public restroom sync failed safely: {}", e.getMessage());
        }
    }
}

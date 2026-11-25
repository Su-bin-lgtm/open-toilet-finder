package com.opentoilet.config;

import com.opentoilet.service.PublicRestroomSyncService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@EnableScheduling
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.public-restroom.daily-sync.enabled", havingValue = "true")
public class PublicRestroomDailySync {
    private final PublicRestroomSyncService syncService;

    @Scheduled(cron = "${app.public-restroom.daily-sync.cron:0 15 3 * * *}")
    public void synchronizeDaily() {
        try {
            PublicRestroomSyncService.SyncSummary result = syncService.synchronize();
            log.info("Scheduled restroom sync completed: mode={}, total={}, pages={}, inserted={}, updated={}, skipped={}",
                    result.mode(), result.totalCount(), result.pages(), result.inserted(), result.updated(), result.skipped());
        } catch (RuntimeException e) {
            log.error("Scheduled restroom sync failed safely: {}", e.getMessage());
        }
    }
}

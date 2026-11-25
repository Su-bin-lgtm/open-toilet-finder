package com.opentoilet.config;

import com.opentoilet.entity.Toilet;
import com.opentoilet.entity.enums.HygieneStatus;
import com.opentoilet.entity.enums.SourceType;
import com.opentoilet.repository.ToiletRepository;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

// 개발/테스트용 개방화장실 샘플 데이터 자동 생성 시더
@Slf4j
@Component
@ConditionalOnProperty(name = "app.seeder.initial-data.enabled", havingValue = "true")
@RequiredArgsConstructor
public class InitialDataSeeder implements CommandLineRunner {

    private final ToiletRepository toiletRepository;

    @Override
    public void run(String... args) {
        if (toiletRepository.count() > 0) {
            log.info("기존 화장실 데이터가 존재하므로 초기 샘플 데이터를 삽입하지 않습니다. (총 {}건)", toiletRepository.count());
            return;
        }

        log.info("초기 테스트용 개방화장실 샘플 데이터를 데이터베이스에 등록합니다...");

        List<Toilet> sampleToilets = List.of(
                // 1. 선문대학교 아산캠퍼스 본관 개방화장실
                Toilet.builder()
                        .name("선문대학교 본관 1층 로비 개방화장실")
                        .address("충청남도 아산시 탕정면 선문로 221 본관 1층")
                        .latitude(36.798782)
                        .longitude(127.074984)
                        .openTimeInfo("08:00 ~ 22:00")
                        .isOpen24h(false)
                        .doorLockCode(null)
                        .isUnisex(false)
                        .maleWaterClosetCount(3)
                        .maleUrinalCount(4)
                        .femaleWaterClosetCount(5)
                        .hasDisabledToilet(true)
                        .hasDiaperTable(true)
                        .hasTissue(true)
                        .hygieneStatus(HygieneStatus.CLEAN)
                        .emergencyBell(true)
                        .cctvInstalled(true)
                        .managementAgency("선문대학교 시설팀")
                        .phoneNumber("041-530-2114")
                        .sourceType(SourceType.USER_REGISTERED)
                        .build(),

                // 2. 선문대 공학관 화장실 (24시간 상시 개방)
                Toilet.builder()
                        .name("선문대학교 공학관 개방화장실")
                        .address("충청남도 아산시 탕정면 선문로 221 공학관 1층")
                        .latitude(36.799650)
                        .longitude(127.073520)
                        .openTimeInfo("24시간 상시 개방")
                        .isOpen24h(true)
                        .doorLockCode(null)
                        .isUnisex(false)
                        .maleWaterClosetCount(4)
                        .maleUrinalCount(5)
                        .femaleWaterClosetCount(6)
                        .hasDisabledToilet(true)
                        .hasDiaperTable(false)
                        .hasTissue(true)
                        .hygieneStatus(HygieneStatus.CLEAN)
                        .emergencyBell(true)
                        .cctvInstalled(true)
                        .managementAgency("선문대학교 공학대학")
                        .sourceType(SourceType.USER_REGISTERED)
                        .build(),

                // 3. 천안아산역 KTX 광장 공중화장실
                Toilet.builder()
                        .name("천안아산역 KTX 서측 광장 공중화장실")
                        .address("충청남도 아산시 배방읍 희망로 100")
                        .latitude(36.794420)
                        .longitude(127.104250)
                        .openTimeInfo("24시간 상시 개방")
                        .isOpen24h(true)
                        .doorLockCode(null)
                        .isUnisex(false)
                        .maleWaterClosetCount(5)
                        .maleUrinalCount(8)
                        .femaleWaterClosetCount(8)
                        .hasDisabledToilet(true)
                        .hasDiaperTable(true)
                        .hasTissue(true)
                        .hygieneStatus(HygieneStatus.CLEAN)
                        .emergencyBell(true)
                        .cctvInstalled(true)
                        .managementAgency("한국철도공사 대전충남본부")
                        .phoneNumber("1544-7788")
                        .sourceType(SourceType.PUBLIC_DATA)
                        .build(),

                // 4. 배방읍 행정복지센터 개방화장실 (도어락 번호 제보 예시)
                Toilet.builder()
                        .name("배방읍 상가 개방화장실")
                        .address("충청남도 아산시 배방읍 모산로 126")
                        .latitude(36.778500)
                        .longitude(127.054300)
                        .openTimeInfo("09:00 ~ 21:00")
                        .isOpen24h(false)
                        .doorLockCode("1234*")
                        .isUnisex(true)
                        .maleWaterClosetCount(1)
                        .maleUrinalCount(1)
                        .femaleWaterClosetCount(2)
                        .hasDisabledToilet(false)
                        .hasDiaperTable(false)
                        .hasTissue(false)
                        .hygieneStatus(HygieneStatus.NORMAL)
                        .emergencyBell(false)
                        .cctvInstalled(true)
                        .managementAgency("상가번영회")
                        .sourceType(SourceType.USER_REGISTERED)
                        .build()
        );

        toiletRepository.saveAll(sampleToilets);
        log.info("샘플 화장실 데이터 {}건이 성공적으로 등록되었습니다.", sampleToilets.size());
    }
}

package com.opentoilet.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.opentoilet.repository.ToiletRepository;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class ToiletDataImportServiceTest {
    private final ToiletRepository repository = mock(ToiletRepository.class);
    private final ToiletDataImportService service = new ToiletDataImportService(repository, new ObjectMapper());

    @Test
    void csvUsesHeaderAliasesAndSkipsDuplicateRows() {
        String csv = "화장실명,도로명주소,지번주소,남녀공용여부,남성용대변기수,남성용소변기수,여성용대변기수,남성용장애인용대변기수,여성용장애인용대변기수,개방시간,위도,경도,기저귀교환대,휴지비치여부\n"
                + "\"시청, 공중화장실\",서울로,,Y,2,1,4,0,1,24시간,37.5665,126.9780,Y,Y\n"
                + "\"시청, 공중화장실\",서울로,,Y,2,1,4,0,1,24시간,37.5665,126.9780,Y,Y\n";

        ToiletDataImportService.DataImportResult result = service.importCsvData(
                new ByteArrayInputStream(csv.getBytes(StandardCharsets.UTF_8)), "UTF-8");

        assertEquals(1, result.imported());
        assertEquals(1, result.duplicates());
        assertEquals(0, result.skipped());
        verify(repository).saveAll(anyList());
    }

    @Test
    void jsonArrayIsSupportedAndInvalidCoordinatesAreReported() {
        String json = "[{\"화장실명\":\"JSON 화장실\",\"도로명주소\":\"서울로 1\",\"위도\":37.5,\"경도\":127.0},"
                + "{\"화장실명\":\"잘못된 좌표\",\"도로명주소\":\"서울로 2\",\"위도\":0,\"경도\":127.0}]";

        ToiletDataImportService.DataImportResult result = service.importJsonData(
                new ByteArrayInputStream(json.getBytes(StandardCharsets.UTF_8)));

        assertEquals(1, result.imported());
        assertEquals(1, result.skipped());
        assertTrue(result.errors().get(0).contains("위도"));
        verify(repository).saveAll(anyList());
    }

    @Test
    void csvRequiresColumnNamesForRequiredFields() {
        String csv = "name,roadAddress,latitude\nToilet,Seoul,37.5";
        assertThrows(IllegalArgumentException.class, () -> service.importCsvData(
                new ByteArrayInputStream(csv.getBytes(StandardCharsets.UTF_8)), "UTF-8"));
        verify(repository, never()).saveAll(anyList());
    }

    @Test
    void csvFlushesLargeInputInFiveHundredRowBatches() {
        StringBuilder csv = new StringBuilder("화장실명,도로명주소,위도,경도\n");
        for (int i = 0; i < 1_001; i++) {
            csv.append("화장실-").append(i).append(",서울로 ").append(i)
                    .append(",37.5,").append(127.0 + i * 0.00001).append('\n');
        }

        ToiletDataImportService.DataImportResult result = service.importCsvData(
                new ByteArrayInputStream(csv.toString().getBytes(StandardCharsets.UTF_8)), "UTF-8");

        assertEquals(1_001, result.imported());
        assertEquals(0, result.duplicates());
        assertEquals(0, result.skipped());
        verify(repository, times(3)).saveAll(anyList());
    }

    @Test
    void csvRejectsMoreThanOneHundredThousandRowsWithoutSaving() {
        StringBuilder csv = new StringBuilder("화장실명,도로명주소,위도,경도\n");
        for (int i = 0; i < 100_001; i++) csv.append(",서울로,37.5,127.0\n");

        assertThrows(IllegalArgumentException.class, () -> service.importCsvData(
                new ByteArrayInputStream(csv.toString().getBytes(StandardCharsets.UTF_8)), "UTF-8"));
        verify(repository, never()).saveAll(anyList());
    }
}

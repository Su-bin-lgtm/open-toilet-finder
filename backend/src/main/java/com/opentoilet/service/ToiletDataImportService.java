package com.opentoilet.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.JsonToken;
import com.opentoilet.entity.Toilet;
import com.opentoilet.entity.enums.HygieneStatus;
import com.opentoilet.entity.enums.SourceType;
import com.opentoilet.repository.ToiletRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.*;
import java.text.Normalizer;
import java.util.*;

@Service
@RequiredArgsConstructor
public class ToiletDataImportService {
    private static final int BATCH_SIZE = 500;
    private static final int MAX_ERRORS = 50;
    private static final int MAX_IMPORT_ROWS = 100_000;
    private static final List<String> NAME = List.of("개방화장실명", "화장실명", "화장실명칭", "시설명", "name");
    private static final List<String> ROAD = List.of("소재지도로명주소", "도로명주소", "도로명소재지주소", "roadAddress");
    private static final List<String> LOT = List.of("소재지지번주소", "지번주소", "lotAddress");
    private static final List<String> LAT = List.of("위도", "latitude", "wgs84위도");
    private static final List<String> LNG = List.of("경도", "longitude", "wgs84경도");

    private final ToiletRepository toiletRepository;
    private final ObjectMapper objectMapper;

    @Transactional
    public DataImportResult importCsvData(InputStream input, String charsetName) {
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(input, Charset.forName(charsetName)))) {
            List<String> header = readCsvRecord(reader);
            if (header == null || header.isEmpty()) throw new IllegalArgumentException("CSV 파일이 비어 있습니다.");
            if (header.get(0).startsWith("\uFEFF")) header.set(0, header.get(0).substring(1));
            Map<String, Integer> columns = indexHeader(header);
            requireColumns(columns);

            ImportAccumulator accumulator = new ImportAccumulator();
            List<String> row;
            int rowNumber = 1;
            while ((row = readCsvRecord(reader)) != null) {
                rowNumber++;
                if (rowNumber - 1 > MAX_IMPORT_ROWS) {
                    throw new IllegalArgumentException("CSV는 최대 " + MAX_IMPORT_ROWS + "행까지 가져올 수 있습니다.");
                }
                if (row.stream().allMatch(String::isBlank)) continue;
                List<String> currentRow = row;
                accumulator.accept(key -> value(currentRow, columns, key), rowNumber);
            }
            return accumulator.finish();
        } catch (IOException | IllegalCharsetNameException | UnsupportedCharsetException ex) {
            throw new IllegalArgumentException("CSV 파일 또는 문자 인코딩을 읽을 수 없습니다.", ex);
        }
    }

    @Transactional
    public DataImportResult importJsonData(InputStream input) {
        try (JsonParser parser = objectMapper.getFactory().createParser(input)) {
            JsonToken root = parser.nextToken();
            ImportAccumulator accumulator = new ImportAccumulator();
            if (root == JsonToken.START_ARRAY) {
                readJsonArray(parser, accumulator);
            } else if (root == JsonToken.START_OBJECT) {
                boolean foundArray = false;
                JsonToken token;
                while ((token = parser.nextToken()) != null && token != JsonToken.END_OBJECT) {
                    if (token != JsonToken.FIELD_NAME) continue;
                    String field = parser.currentName();
                    token = parser.nextToken();
                    if (("data".equals(field) || "items".equals(field)) && token == JsonToken.START_ARRAY) {
                        readJsonArray(parser, accumulator);
                        foundArray = true;
                        break;
                    }
                    parser.skipChildren();
                }
                if (!foundArray) throw new IllegalArgumentException("JSON은 배열 또는 data/items 배열을 포함해야 합니다.");
            } else {
                throw new IllegalArgumentException("JSON은 배열 또는 data/items 배열을 포함해야 합니다.");
            }
            return accumulator.finish();
        } catch (IOException ex) {
            throw new IllegalArgumentException("JSON 파일을 읽을 수 없습니다.", ex);
        }
    }

    private void readJsonArray(JsonParser parser, ImportAccumulator accumulator) throws IOException {
        int rowNumber = 0;
        JsonToken token;
        while ((token = parser.nextToken()) != null && token != JsonToken.END_ARRAY) {
            rowNumber++;
            if (rowNumber > MAX_IMPORT_ROWS) {
                throw new IllegalArgumentException("JSON은 최대 " + MAX_IMPORT_ROWS + "행까지 가져올 수 있습니다.");
            }
            JsonNode node = objectMapper.readTree(parser);
            accumulator.accept(key -> jsonValue(node, key), rowNumber);
        }
    }

    private Toilet toToilet(ValueReader source) {
        String name = source.get(NAME);
        String road = source.get(ROAD);
        String address = road.isBlank() ? source.get(LOT) : road;
        if (name.isBlank()) throw new IllegalArgumentException("화장실 이름이 없습니다.");
        if (address.isBlank()) throw new IllegalArgumentException("도로명 또는 지번 주소가 없습니다.");
        if (name.length() > 100 || address.length() > 255) throw new IllegalArgumentException("이름 또는 주소 길이가 허용 범위를 넘었습니다.");

        double latitude = parseCoordinate(source.get(LAT), 33, 39, "위도");
        double longitude = parseCoordinate(source.get(LNG), 124, 132, "경도");
        String openTime = source.get(List.of("개방시간", "운영시간", "openTimeInfo"));
        int maleDisabled = parseCount(source.get(List.of("남성용장애인용대변기수", "남성장애인용대변기수")));
        int femaleDisabled = parseCount(source.get(List.of("여성용장애인용대변기수", "여성장애인용대변기수")));
        boolean diaper = isYes(source.get(List.of("기저귀교환대", "기저귀교환대유무", "기저귀교환대여부", "hasDiaperTable")));
        String tissueValue = source.get(List.of("휴지비치여부", "휴지유무", "hasTissue"));

        return Toilet.builder().name(name).address(address).latitude(latitude).longitude(longitude)
                .openTimeInfo(blankToNull(openTime)).isOpen24h(openTime.contains("24시간") || openTime.contains("상시"))
                .isUnisex(isYes(source.get(List.of("남녀공용화장실여부", "남녀공용여부", "isUnisex"))))
                .maleWaterClosetCount(parseCount(source.get(List.of("남성용대변기수", "남성대변기수", "maleWaterClosetCount"))))
                .maleUrinalCount(parseCount(source.get(List.of("남성용소변기수", "남성소변기수", "maleUrinalCount"))))
                .femaleWaterClosetCount(parseCount(source.get(List.of("여성용대변기수", "여성대변기수", "femaleWaterClosetCount"))))
                .hasDisabledToilet(maleDisabled > 0 || femaleDisabled > 0 || isYes(source.get(List.of("장애인화장실여부", "hasDisabledToilet"))))
                .hasDiaperTable(diaper).hasTissue(!tissueValue.isBlank() && isYes(tissueValue))
                .hygieneStatus(HygieneStatus.NORMAL)
                .managementAgency(blankToNull(source.get(List.of("관리기관명", "관리기관", "managementAgency"))))
                .phoneNumber(blankToNull(source.get(List.of("전화번호", "연락처", "phoneNumber"))))
                .sourceType(SourceType.PUBLIC_DATA).build();
    }

    private Map<String, Integer> indexHeader(List<String> headers) {
        Map<String, Integer> result = new HashMap<>();
        for (int i = 0; i < headers.size(); i++) result.put(normalize(headers.get(i)), i);
        return result;
    }

    private void requireColumns(Map<String, Integer> columns) {
        if (findColumn(columns, NAME) == null || findColumn(columns, ROAD) == null && findColumn(columns, LOT) == null
                || findColumn(columns, LAT) == null || findColumn(columns, LNG) == null) {
            throw new IllegalArgumentException("필수 헤더(화장실명, 주소, 위도, 경도)를 찾지 못했습니다. 컬럼명 기반 표준 CSV를 확인해 주세요.");
        }
    }

    private Integer findColumn(Map<String, Integer> columns, List<String> aliases) {
        for (String alias : aliases) {
            Integer index = columns.get(normalize(alias));
            if (index != null) return index;
        }
        return null;
    }

    private String value(List<String> row, Map<String, Integer> columns, List<String> aliases) {
        Integer index = findColumn(columns, aliases);
        return index == null || index >= row.size() ? "" : clean(row.get(index));
    }

    private String jsonValue(JsonNode row, List<String> aliases) {
        if (!row.isObject()) throw new IllegalArgumentException("각 JSON 항목은 객체여야 합니다.");
        for (String alias : aliases) {
            String wanted = normalize(alias);
            Iterator<Map.Entry<String, JsonNode>> fields = row.fields();
            while (fields.hasNext()) {
                var field = fields.next();
                if (normalize(field.getKey()).equals(wanted)) return clean(field.getValue().asText(""));
            }
        }
        return "";
    }

    private List<String> readCsvRecord(BufferedReader reader) throws IOException {
        List<String> row = new ArrayList<>();
        StringBuilder cell = new StringBuilder();
        boolean quoted = false;
        int value;
        boolean readAny = false;
        while ((value = reader.read()) != -1) {
            readAny = true;
            char c = (char) value;
            if (quoted) {
                if (c == '"') {
                    reader.mark(1);
                    int next = reader.read();
                    if (next == '"') cell.append('"');
                    else { quoted = false; if (next != -1) reader.reset(); }
                } else cell.append(c);
            } else if (c == '"' && cell.isEmpty()) quoted = true;
            else if (c == ',') { row.add(clean(cell.toString())); cell.setLength(0); }
            else if (c == '\n' || c == '\r') {
                if (c == '\r') { reader.mark(1); int next = reader.read(); if (next != '\n' && next != -1) reader.reset(); }
                row.add(clean(cell.toString())); cell.setLength(0);
                return row;
            } else cell.append(c);
        }
        if (quoted) throw new IllegalArgumentException("CSV 따옴표가 닫히지 않았습니다.");
        if (!readAny && row.isEmpty() && cell.isEmpty()) return null;
        row.add(clean(cell.toString()));
        return row;
    }

    private double parseCoordinate(String raw, double min, double max, String label) {
        try {
            double value = Double.parseDouble(raw.replace(",", "").trim());
            if (!Double.isFinite(value) || value < min || value > max) throw new NumberFormatException();
            return value;
        } catch (NumberFormatException ex) { throw new IllegalArgumentException(label + " 값이 유효하지 않습니다."); }
    }

    private int parseCount(String raw) {
        if (raw.isBlank()) return 0;
        try { int count = Integer.parseInt(raw.trim()); if (count < 0) throw new NumberFormatException(); return count; }
        catch (NumberFormatException ex) { throw new IllegalArgumentException("시설 수량이 숫자가 아닙니다."); }
    }

    private boolean isYes(String value) { return Set.of("y", "yes", "true", "1", "있음", "설치").contains(value.trim().toLowerCase(Locale.ROOT)); }
    private String normalize(String value) { return Normalizer.normalize(value == null ? "" : value, Normalizer.Form.NFKC).toLowerCase(Locale.ROOT).replaceAll("[\\s_\\-()\\[\\]{}·/]+", ""); }
    private String clean(String value) { return value == null ? "" : value.trim(); }
    private String blankToNull(String value) { return value == null || value.isBlank() ? null : value.trim(); }
    private String dedupKey(Toilet toilet) { return normalize(toilet.getName()) + "|" + normalize(toilet.getAddress()) + "|" + toilet.getLatitude() + "|" + toilet.getLongitude(); }
    private void addError(List<String> errors, int row, String message) { if (errors.size() < MAX_ERRORS) errors.add("행 " + row + ": " + message); }

    private final class ImportAccumulator {
        private final List<Toilet> batch = new ArrayList<>(BATCH_SIZE);
        private final Set<String> inFile = new HashSet<>();
        private final List<String> errors = new ArrayList<>();
        private int imported;
        private int duplicates;
        private int skipped;

        private void accept(ValueReader source, int rowNumber) {
            try {
                Toilet toilet = toToilet(source);
                String key = dedupKey(toilet);
                if (!inFile.add(key) || toiletRepository.existsByNameAndAddressAndLatitudeAndLongitude(
                        toilet.getName(), toilet.getAddress(), toilet.getLatitude(), toilet.getLongitude())) {
                    duplicates++;
                    return;
                }
                batch.add(toilet);
                if (batch.size() == BATCH_SIZE) flush();
            } catch (IllegalArgumentException ex) {
                skipped++;
                addError(errors, rowNumber, ex.getMessage());
            }
        }

        private void flush() {
            if (batch.isEmpty()) return;
            int count = batch.size();
            toiletRepository.saveAll(batch);
            imported += count;
            batch.clear();
        }

        private DataImportResult finish() {
            flush();
            return new DataImportResult(imported, duplicates, skipped, errors);
        }
    }

    @FunctionalInterface private interface ValueReader { String get(List<String> aliases); }

    public record DataImportResult(int imported, int duplicates, int skipped, List<String> errors) { }
}

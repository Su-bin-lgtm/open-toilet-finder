package com.opentoilet.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.util.UriBuilder;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;

/** Sequential, resumable synchronization of the official Ministry of the Interior public restroom API. */
@Service
@RequiredArgsConstructor
@Slf4j
public class PublicRestroomSyncService {
    private static final String SOURCE = "MOIS_PUBLIC_RESTROOM";
    private static final String LOCK_NAME = "open_toilet_mois_public_restroom_sync";
    private static final int PAGE_SIZE = 100;
    private static final int MAX_ATTEMPTS = 3;
    private static final DateTimeFormatter API_TIME = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
    private static final String UPSERT = """
            INSERT INTO toilet (
              name,address,latitude,longitude,lot_address,facility_type,opening_authority_code,
              open_time_info,is_open24h,door_lock_code,is_unisex,male_water_closet_count,male_urinal_count,
              female_water_closet_count,has_disabled_toilet,has_diaper_table,has_tissue,hygiene_status,
              emergency_bell,cctv_installed,management_agency,phone_number,source_type,source_system,
              source_record_id,data_base_date,source_updated_at,source_payload,created_at,updated_at
            ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'PUBLIC_DATA',?,?,?,?,?,NOW(),NOW())
            ON DUPLICATE KEY UPDATE
              name=VALUES(name), address=VALUES(address), latitude=VALUES(latitude), longitude=VALUES(longitude),
              lot_address=VALUES(lot_address), facility_type=VALUES(facility_type),
              opening_authority_code=VALUES(opening_authority_code), open_time_info=VALUES(open_time_info),
              is_open24h=VALUES(is_open24h), male_water_closet_count=VALUES(male_water_closet_count),
              male_urinal_count=VALUES(male_urinal_count), female_water_closet_count=VALUES(female_water_closet_count),
              has_disabled_toilet=VALUES(has_disabled_toilet), has_diaper_table=VALUES(has_diaper_table),
              emergency_bell=VALUES(emergency_bell), cctv_installed=VALUES(cctv_installed),
              management_agency=VALUES(management_agency), phone_number=VALUES(phone_number),
              data_base_date=VALUES(data_base_date), source_updated_at=VALUES(source_updated_at),
              source_payload=VALUES(source_payload), updated_at=NOW()
            """;

    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;
    private final RestClient.Builder restClientBuilder;
    private final DataSource dataSource;
    private final Environment environment;
    private final AtomicBoolean running = new AtomicBoolean(false);

    @Value("${PUBLIC_RESTROOM_SERVICE_KEY:}")
    private String serviceKey;

    @Value("${public-restroom.api-url:https://apis.data.go.kr/1741000/public_restroom_info_v2/info_v2}")
    private String apiUrl;

    /** Runs a full initial import if incomplete, otherwise a DAT_UPDT_PNT incremental sync. */
    public SyncSummary synchronize() {
        requireDevelopmentDatabase();
        if (serviceKey == null || serviceKey.isBlank()) {
            throw new IllegalStateException("PUBLIC_RESTROOM_SERVICE_KEY is not available to the backend process.");
        }
        if (!running.compareAndSet(false, true)) throw new IllegalStateException("A restroom synchronization is already running.");
        try (Connection lockConnection = dataSource.getConnection()) {
            if (!acquireLock(lockConnection)) throw new IllegalStateException("A restroom synchronization is already running on another backend instance.");
            try {
                ensureStateRow();
                State state = readState();
                return state.lastFullSuccessAt == null ? syncFull(state) : syncIncremental(state);
            } finally {
                releaseLock(lockConnection);
            }
        } catch (SQLException e) {
            updateStatus("FAILED", 0, 0, 0, "Database synchronization lock failed");
            throw new IllegalStateException("Development database synchronization could not start.", e);
        } catch (RuntimeException e) {
            updateStatus("FAILED", 0, 0, 0, safeMessage(e));
            throw e;
        } finally {
            running.set(false);
        }
    }

    private SyncSummary syncFull(State state) {
        int page = Math.max(1, state.nextPage);
        long total = state.totalCount;
        long inserted = 0, updated = 0, skipped = 0;
        String maxUpdatePoint = state.lastIncrementalPoint;
        updateStatus("RUNNING_FULL", 0, 0, 0, null);

        do {
            ApiPage apiPage = fetchPage(page, null, null);
            if (page == 1 || total == 0) total = apiPage.totalCount;
            if (apiPage.pageNo != page || apiPage.totalCount != total) {
                throw new IllegalStateException("API pagination metadata changed during full synchronization.");
            }
            long expectedRows = Math.min(PAGE_SIZE, Math.max(0, total - (long) (page - 1) * PAGE_SIZE));
            if (apiPage.items.size() != expectedRows) {
                throw new IllegalStateException("API page row count does not match pagination metadata; checkpoint was not advanced.");
            }
            PageSaveResult saved = savePage(apiPage.items);
            inserted += saved.inserted;
            updated += saved.updated;
            skipped += saved.skipped;
            maxUpdatePoint = laterPoint(maxUpdatePoint, saved.maxUpdatePoint);
            int nextPage = page + 1;
            checkpoint(nextPage, total, maxUpdatePoint, inserted, updated, skipped);
            long pageCount = Math.max(1, (total + PAGE_SIZE - 1) / PAGE_SIZE);
            if (page == 1 || page % 25 == 0 || page >= pageCount) {
                log.info("Public restroom full sync progress: page {}/{} (inserted={}, updated={}, skipped={})",
                        page, pageCount, inserted, updated, skipped);
            }
            if (page >= pageCount) {
                jdbcTemplate.update("UPDATE public_restroom_sync_state SET full_next_page=1,total_count=?,last_full_success_at=NOW(),last_incremental_point=?,last_status='FULL_SUCCESS',last_inserted=?,last_updated=?,last_skipped=?,last_error=NULL,updated_at=NOW() WHERE sync_name=?",
                        total, maxUpdatePoint, inserted, updated, skipped, SOURCE);
                return new SyncSummary("FULL_SUCCESS", total, page, inserted, updated, skipped, maxUpdatePoint);
            }
            page = nextPage;
            pauseBetweenRequests();
        } while (true);
    }

    private SyncSummary syncIncremental(State state) {
        if (state.lastIncrementalPoint == null || state.lastIncrementalPoint.isBlank()) {
            throw new IllegalStateException("Full data has no DAT_UPDT_PNT checkpoint; incremental synchronization is unavailable.");
        }
        String upperBound = LocalDateTime.now().format(API_TIME);
        long total = 0, inserted = 0, updated = 0, skipped = 0;
        String maxUpdatePoint = state.lastIncrementalPoint;
        int pages = 0;
        updateStatus("RUNNING_INCREMENTAL", 0, 0, 0, null);
        for (int page = 1; ; page++) {
            ApiPage apiPage = fetchPage(page, state.lastIncrementalPoint, upperBound);
            if (page == 1) total = apiPage.totalCount;
            PageSaveResult saved = savePage(apiPage.items);
            inserted += saved.inserted;
            updated += saved.updated;
            skipped += saved.skipped;
            maxUpdatePoint = laterPoint(maxUpdatePoint, saved.maxUpdatePoint);
            pages = page;
            checkpoint(1, state.totalCount, maxUpdatePoint, inserted, updated, skipped);
            if (page * PAGE_SIZE >= total) break;
            pauseBetweenRequests();
        }
        jdbcTemplate.update("UPDATE public_restroom_sync_state SET last_incremental_point=?,last_status='INCREMENTAL_SUCCESS',last_inserted=?,last_updated=?,last_skipped=?,last_error=NULL,updated_at=NOW() WHERE sync_name=?",
                maxUpdatePoint, inserted, updated, skipped, SOURCE);
        return new SyncSummary("INCREMENTAL_SUCCESS", total, pages, inserted, updated, skipped, maxUpdatePoint);
    }

    private ApiPage fetchPage(int page, String changedFrom, String changedBefore) {
        RuntimeException last = null;
        for (int attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
            try {
                String body = restClientBuilder.build().get().uri(uri -> buildUri(uri, page, changedFrom, changedBefore)).retrieve().body(String.class);
                JsonNode root = objectMapper.readTree(body);
                JsonNode response = root.path("response");
                JsonNode header = response.path("header");
                if (header.isMissingNode() || header.path("resultCode").isMissingNode()) {
                    throw new IllegalStateException("API_RESPONSE_SCHEMA_ERROR: response.header.resultCode is missing.");
                }
                String resultCode = header.path("resultCode").asText();
                if (!"0".equals(resultCode)) {
                    throw new IllegalStateException("API_APPLICATION_ERROR: resultCode=" + resultCode);
                }
                JsonNode payload = response.path("body");
                if (!payload.path("totalCount").canConvertToLong() || !payload.path("pageNo").canConvertToInt()) {
                    throw new IllegalStateException("API_RESPONSE_SCHEMA_ERROR: pagination metadata is missing.");
                }
                List<JsonNode> items = readItems(payload.path("items"));
                return new ApiPage(payload.path("totalCount").asLong(), payload.path("pageNo").asInt(), items);
            } catch (RestClientResponseException e) {
                last = new IllegalStateException("API_HTTP_ERROR: status=" + e.getStatusCode().value(), e);
                if (e.getStatusCode().is4xxClientError() || attempt == MAX_ATTEMPTS) break;
            } catch (IllegalStateException e) {
                if (e.getMessage() != null && (e.getMessage().startsWith("API_APPLICATION_ERROR") || e.getMessage().startsWith("API_RESPONSE_SCHEMA_ERROR"))) throw e;
                last = e;
                if (attempt == MAX_ATTEMPTS) break;
            } catch (Exception e) {
                last = new IllegalStateException("API_REQUEST_OR_JSON_ERROR", e);
                if (attempt == MAX_ATTEMPTS) break;
            }
            sleep(500L * attempt);
        }
        throw last == null ? new IllegalStateException("API_REQUEST_FAILED") : last;
    }

    private java.net.URI buildUri(UriBuilder builder, int page, String from, String before) {
        UriBuilder result = builder.scheme("https").host("apis.data.go.kr").path("/1741000/public_restroom_info_v2/info_v2")
                .queryParam("serviceKey", serviceKey).queryParam("pageNo", page)
                .queryParam("numOfRows", PAGE_SIZE).queryParam("returnType", "json");
        if (from != null) result.queryParam("cond[DAT_UPDT_PNT::GTE]", from);
        if (before != null) result.queryParam("cond[DAT_UPDT_PNT::LT]", before);
        return result.build();
    }

    private List<JsonNode> readItems(JsonNode itemContainer) {
        JsonNode nodes = itemContainer;
        if (nodes.isObject() && nodes.has("item")) nodes = nodes.path("item");
        List<JsonNode> result = new ArrayList<>();
        if (nodes.isArray()) nodes.forEach(result::add);
        else if (nodes.isObject()) result.add(nodes);
        else if (!nodes.isNull() && !nodes.isMissingNode()) throw new IllegalStateException("API_RESPONSE_SCHEMA_ERROR: items is not an array or object.");
        return result;
    }

    private PageSaveResult savePage(List<JsonNode> items) {
        List<MappedItem> valid = new ArrayList<>();
        long skipped = 0;
        String maxPoint = null;
        for (JsonNode item : items) {
            String point = text(item, "DAT_UPDT_PNT");
            maxPoint = laterPoint(maxPoint, normalizeApiPoint(point));
            MappedItem row = map(item);
            if (row == null) skipped++; else valid.add(row);
        }
        int[][] outcomes = jdbcTemplate.batchUpdate(UPSERT, valid, PAGE_SIZE, PublicRestroomSyncService::bind);
        long inserted = 0, updated = 0;
        for (int[] batch : outcomes) {
            for (int outcome : batch) {
                if (outcome == 1) inserted++;
                else if (outcome == 2 || outcome == 0 || outcome == java.sql.Statement.SUCCESS_NO_INFO) updated++;
            }
        }
        return new PageSaveResult(inserted, updated, skipped, maxPoint);
    }

    private MappedItem map(JsonNode item) {
        String id = text(item, "MNG_NO");
        String name = text(item, "RSTRM_NM");
        String road = text(item, "LCTN_ROAD_NM_ADDR");
        String lot = text(item, "LCTN_LOTNO_ADDR");
        String address = road.isBlank() ? lot : road;
        if (id.isBlank() || name.isBlank() || address.isBlank()) return null;

        String opening = firstNonBlank(text(item, "OPN_HR_DTL"), text(item, "OPN_HR"));
        Integer maleDisabled = integer(item, "MALE_FRDBL_TOILT_CNT");
        Integer femaleDisabled = integer(item, "FEMALE_FRDBL_TOILT_CNT");
        Boolean disabled = maleDisabled == null && femaleDisabled == null ? null : (value(maleDisabled) + value(femaleDisabled) > 0);
        Boolean open24h = opening.isBlank() ? null : (opening.contains("24시간") || opening.contains("상시") || opening.contains("00:00~24:00") || opening.contains("00:00 ~ 24:00"));
        try {
            return new MappedItem(name, address, lot.isBlank() ? null : lot, nullableText(item, "SE_NM"), nullableText(item, "OPN_ATMY_GRP_CD"),
                    opening.isBlank() ? null : opening, open24h, integer(item, "MALE_TOILT_CNT"), integer(item, "MALE_URNL_CNT"),
                    integer(item, "FEMALE_TOILT_CNT"), disabled, yesNo(item, "DIAP_EXCHCON_EN"), yesNo(item, "EMRGNCBLL_INSTL_YN"),
                    yesNo(item, "RSTRM_ENTRAN_CCTV_INSTL_EN"), nullableText(item, "MNG_INST_NM"), nullableText(item, "TELNO"),
                    id, nullableText(item, "DAT_CRTR_YMD"), nullableText(item, "DAT_UPDT_PNT"), objectMapper.writeValueAsString(item));
        } catch (Exception e) {
            throw new IllegalStateException("API_RESPONSE_MAPPING_ERROR", e);
        }
    }

    private static void bind(PreparedStatement ps, MappedItem r) throws SQLException {
        int i = 1;
        ps.setString(i++, r.name); ps.setString(i++, r.address); ps.setObject(i++, null); ps.setObject(i++, null);
        ps.setString(i++, r.lotAddress); ps.setString(i++, r.facilityType); ps.setString(i++, r.authorityCode);
        ps.setString(i++, r.openTime); ps.setObject(i++, r.open24h); ps.setObject(i++, null); ps.setObject(i++, null);
        ps.setObject(i++, r.maleToilet); ps.setObject(i++, r.maleUrinal); ps.setObject(i++, r.femaleToilet);
        ps.setObject(i++, r.disabled); ps.setObject(i++, r.diaper); ps.setObject(i++, null); ps.setObject(i++, null);
        ps.setObject(i++, r.emergencyBell); ps.setObject(i++, r.cctv); ps.setString(i++, r.agency); ps.setString(i++, r.phone);
        ps.setString(i++, SOURCE); ps.setString(i++, r.id); ps.setString(i++, r.baseDate); ps.setString(i++, r.updatedAt); ps.setString(i, r.payload);
    }

    private void requireDevelopmentDatabase() {
        String configuredUrl = environment.getProperty("spring.datasource.url", "");
        if (!"jdbc:mysql://127.0.0.1:3306/open_toilet_devtest".equals(configuredUrl)) {
            throw new IllegalStateException("Refusing sync: DB_URL is not the exact open_toilet_devtest URL.");
        }
        // Also verify the connected catalog in case a datasource proxy routes elsewhere.
        try (Connection connection = dataSource.getConnection()) {
            String database = connection.getCatalog();
            if (!"open_toilet_devtest".equals(database)) throw new IllegalStateException("Refusing sync: active database is not open_toilet_devtest.");
        } catch (SQLException e) {
            throw new IllegalStateException("Cannot verify the active development database.", e);
        }
    }

    private boolean acquireLock(Connection c) throws SQLException {
        try (PreparedStatement ps = c.prepareStatement("SELECT GET_LOCK(?,0)")) { ps.setString(1, LOCK_NAME); try (ResultSet rs = ps.executeQuery()) { return rs.next() && rs.getInt(1) == 1; } }
    }
    private void releaseLock(Connection c) {
        try (PreparedStatement ps = c.prepareStatement("SELECT RELEASE_LOCK(?)")) { ps.setString(1, LOCK_NAME); ps.execute(); } catch (SQLException ignored) { }
    }

    private void ensureStateRow() {
        jdbcTemplate.update("INSERT INTO public_restroom_sync_state(sync_name,updated_at) VALUES (?,NOW()) ON DUPLICATE KEY UPDATE sync_name=VALUES(sync_name)", SOURCE);
    }
    private State readState() {
        return jdbcTemplate.queryForObject("SELECT full_next_page,total_count,last_full_success_at,last_incremental_point FROM public_restroom_sync_state WHERE sync_name=?",
                (rs, row) -> new State(rs.getInt("full_next_page"), rs.getLong("total_count"), rs.getTimestamp("last_full_success_at"), normalizeApiPoint(rs.getString("last_incremental_point"))), SOURCE);
    }
    private void checkpoint(int nextPage, long total, String point, long inserted, long updated, long skipped) {
        jdbcTemplate.update("UPDATE public_restroom_sync_state SET full_next_page=?,total_count=?,last_incremental_point=?,last_inserted=?,last_updated=?,last_skipped=?,last_error=NULL,updated_at=NOW() WHERE sync_name=?",
                nextPage, total, point, inserted, updated, skipped, SOURCE);
    }
    private void updateStatus(String status, long inserted, long updated, long skipped, String error) {
        try { jdbcTemplate.update("INSERT INTO public_restroom_sync_state(sync_name,last_status,last_inserted,last_updated,last_skipped,last_error,updated_at) VALUES (?,?,?,?,?,?,NOW()) ON DUPLICATE KEY UPDATE last_status=VALUES(last_status),last_inserted=VALUES(last_inserted),last_updated=VALUES(last_updated),last_skipped=VALUES(last_skipped),last_error=VALUES(last_error),updated_at=NOW()",
                SOURCE, status, inserted, updated, skipped, error); } catch (RuntimeException ignored) { }
    }
    private static String safeMessage(RuntimeException e) { String m = e.getMessage(); return m == null ? e.getClass().getSimpleName() : m.substring(0, Math.min(500, m.length())); }

    private static String text(JsonNode node, String field) { JsonNode value = node.get(field); return value == null || value.isNull() ? "" : value.asText().trim(); }
    private static String nullableText(JsonNode node, String field) { String value = text(node, field); return value.isBlank() ? null : value; }
    private static String firstNonBlank(String a, String b) { return a.isBlank() ? b : a; }
    private static Integer integer(JsonNode node, String field) { String text = text(node, field); if (text.isBlank()) return null; try { return Integer.valueOf(text); } catch (NumberFormatException e) { return null; } }
    private static String normalizeApiPoint(String value) {
        if (value == null || value.isBlank()) return null;
        String digits = value.replaceAll("\\D", "");
        return digits.length() == 14 ? digits : null;
    }
    private static Boolean yesNo(JsonNode node, String field) { String value = text(node, field).toUpperCase(); if (value.isBlank()) return null; if (List.of("Y", "YES", "1", "TRUE", "유", "있음").contains(value)) return true; if (List.of("N", "NO", "0", "FALSE", "무", "없음").contains(value)) return false; return null; }
    private static int value(Integer number) { return number == null ? 0 : number; }
    private static String laterPoint(String a, String b) { if (a == null || a.isBlank()) return b; if (b == null || b.isBlank()) return a; return a.compareTo(b) >= 0 ? a : b; }
    private static void pauseBetweenRequests() { sleep(200); }
    private static void sleep(long millis) { try { Thread.sleep(millis); } catch (InterruptedException e) { Thread.currentThread().interrupt(); throw new IllegalStateException("Synchronization interrupted.", e); } }

    public record SyncSummary(String mode, long totalCount, int pages, long inserted, long updated, long skipped, String lastUpdatePoint) { }
    private record ApiPage(long totalCount, int pageNo, List<JsonNode> items) { }
    private record PageSaveResult(long inserted, long updated, long skipped, String maxUpdatePoint) { }
    private record State(int nextPage, long totalCount, java.sql.Timestamp lastFullSuccessAt, String lastIncrementalPoint) { }
    private record MappedItem(String name, String address, String lotAddress, String facilityType, String authorityCode,
                              String openTime, Boolean open24h, Integer maleToilet, Integer maleUrinal, Integer femaleToilet,
                              Boolean disabled, Boolean diaper, Boolean emergencyBell, Boolean cctv, String agency, String phone,
                              String id, String baseDate, String updatedAt, String payload) { }
}

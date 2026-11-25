package com.opentoilet.controller;

import com.opentoilet.dto.response.ApiResponse;
import com.opentoilet.service.ToiletDataImportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import com.opentoilet.service.ToiletDataImportService.DataImportResult;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
public class ToiletDataImportController {

    private final ToiletDataImportService dataImportService;

    // 컬럼명 기반 CSV 또는 JSON 업로드
    @PostMapping(value = "/import", consumes = "multipart/form-data")
    public ResponseEntity<ApiResponse<DataImportResult>> importFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "charset", defaultValue = "UTF-8") String charset
    ) {
        if (file.isEmpty()) return ResponseEntity.badRequest().body(ApiResponse.error("업로드된 파일이 비어 있습니다."));
        if (file.getSize() > 25 * 1024 * 1024) return ResponseEntity.badRequest().body(ApiResponse.error("파일은 25MB 이하여야 합니다."));
        String name = file.getOriginalFilename() == null ? "" : file.getOriginalFilename().toLowerCase(java.util.Locale.ROOT);
        try (InputStream inputStream = file.getInputStream()) {
            DataImportResult result = name.endsWith(".json")
                    ? dataImportService.importJsonData(inputStream)
                    : name.endsWith(".csv") ? dataImportService.importCsvData(inputStream, charset)
                    : null;
            if (result == null) return ResponseEntity.badRequest().body(ApiResponse.error("CSV 또는 JSON 파일만 지원합니다."));
            return ResponseEntity.ok(ApiResponse.ok("가져오기를 완료했습니다. 적재 " + result.imported() + "건, 중복 " + result.duplicates() + "건, 제외 " + result.skipped() + "건입니다.", result));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(ApiResponse.error("파일 처리 중 오류가 발생했습니다."));
        }
    }

    // 이전 CSV 경로 호환
    @PostMapping("/import-csv")
    public ResponseEntity<ApiResponse<DataImportResult>> importCsv(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "charset", defaultValue = "UTF-8") String charset
    ) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("업로드된 파일이 비어 있습니다."));
        }
        if (file.getSize() > 25 * 1024 * 1024) return ResponseEntity.badRequest().body(ApiResponse.error("파일은 25MB 이하여야 합니다."));

        try (InputStream inputStream = file.getInputStream()) {
            DataImportResult result = dataImportService.importCsvData(inputStream, charset);
            return ResponseEntity.ok(ApiResponse.ok("CSV 가져오기를 완료했습니다.", result));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(ApiResponse.error("CSV 처리 중 오류가 발생했습니다."));
        }
    }
}

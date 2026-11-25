-- Additive migration for 행정안전부 공중화장실정보 조회서비스.
-- Apply only after verifying the active JDBC database is open_toilet_devtest.
-- Existing toilet/report rows are preserved; missing national API coordinates stay NULL.
ALTER TABLE toilet
    MODIFY latitude DOUBLE NULL,
    MODIFY longitude DOUBLE NULL,
    ADD COLUMN lot_address VARCHAR(255) NULL,
    ADD COLUMN facility_type VARCHAR(100) NULL,
    ADD COLUMN opening_authority_code VARCHAR(20) NULL,
    ADD COLUMN source_system VARCHAR(50) NULL,
    ADD COLUMN source_record_id VARCHAR(100) NULL,
    ADD COLUMN data_base_date VARCHAR(10) NULL,
    ADD COLUMN source_updated_at VARCHAR(20) NULL,
    ADD COLUMN source_payload LONGTEXT NULL,
    ADD UNIQUE INDEX uk_toilet_source_record (source_system, source_record_id);

CREATE TABLE public_restroom_sync_state (
    sync_name VARCHAR(50) NOT NULL,
    full_next_page INT NOT NULL DEFAULT 1,
    total_count BIGINT NULL,
    last_full_success_at DATETIME NULL,
    last_incremental_point VARCHAR(19) NULL,
    last_status VARCHAR(20) NOT NULL DEFAULT 'IDLE',
    last_inserted BIGINT NOT NULL DEFAULT 0,
    last_updated BIGINT NOT NULL DEFAULT 0,
    last_skipped BIGINT NOT NULL DEFAULT 0,
    last_error VARCHAR(500) NULL,
    updated_at DATETIME NOT NULL,
    PRIMARY KEY (sync_name)
);

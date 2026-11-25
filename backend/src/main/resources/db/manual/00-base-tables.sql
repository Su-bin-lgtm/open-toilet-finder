-- Base schema for Open Toilet Finder operational database.
-- Extracted from development database (open_toilet) structure without data.
-- Apply this file FIRST on a clean database, then apply the additive scripts in order:
--   1. 00-base-tables.sql (this file)
--   2. issue-report-device-id.sql
--   3. issue-review-fields.sql
--   4. account-auth.sql
--   5. report-image.sql
--   6. public-restroom-api.sql

CREATE TABLE IF NOT EXISTS toilet (
    id BIGINT NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    address VARCHAR(255) NOT NULL,
    latitude DOUBLE NOT NULL,
    longitude DOUBLE NOT NULL,
    open_time_info VARCHAR(150) DEFAULT NULL,
    is_open24h BIT(1) DEFAULT NULL,
    door_lock_code VARCHAR(100) DEFAULT NULL,
    is_unisex BIT(1) DEFAULT NULL,
    male_water_closet_count INT DEFAULT NULL,
    male_urinal_count INT DEFAULT NULL,
    female_water_closet_count INT DEFAULT NULL,
    has_disabled_toilet BIT(1) DEFAULT NULL,
    has_diaper_table BIT(1) DEFAULT NULL,
    has_tissue BIT(1) DEFAULT NULL,
    hygiene_status ENUM('CLEAN', 'NORMAL', 'DIRTY') DEFAULT NULL,
    emergency_bell BIT(1) DEFAULT NULL,
    cctv_installed BIT(1) DEFAULT NULL,
    management_agency VARCHAR(100) DEFAULT NULL,
    phone_number VARCHAR(30) DEFAULT NULL,
    source_type ENUM('PUBLIC_DATA', 'USER_REGISTERED') NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    KEY idx_toilet_location (latitude, longitude)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS toilet_report (
    id BIGINT NOT NULL AUTO_INCREMENT,
    toilet_id BIGINT NOT NULL,
    has_tissue BIT(1) NOT NULL,
    hygiene_status ENUM('CLEAN', 'NORMAL', 'DIRTY') NOT NULL,
    is_open BIT(1) NOT NULL,
    door_lock_code VARCHAR(100) DEFAULT NULL,
    comment VARCHAR(300) DEFAULT NULL,
    user_fingerprint VARCHAR(100) DEFAULT NULL,
    created_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    KEY idx_report_toilet_created (toilet_id, created_at),
    CONSTRAINT fk_toilet_report_toilet FOREIGN KEY (toilet_id) REFERENCES toilet (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS issue_report (
    id BIGINT NOT NULL AUTO_INCREMENT,
    toilet_id BIGINT NOT NULL,
    issue_type ENUM('CLOSED', 'WRONG_LOCATION', 'WRONG_PASSWORD', 'OTHER') NOT NULL,
    content VARCHAR(500) NOT NULL,
    status ENUM('RECEIVED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED') NOT NULL,
    created_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    KEY idx_issue_report_toilet (toilet_id),
    CONSTRAINT fk_issue_report_toilet FOREIGN KEY (toilet_id) REFERENCES toilet (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

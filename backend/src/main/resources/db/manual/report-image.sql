-- Additive image metadata migration. Apply only to the selected development/test database first.
-- Image bytes are stored outside the repository. This table stores only an opaque storage key.
CREATE TABLE report_image (
    id BIGINT NOT NULL AUTO_INCREMENT,
    report_kind ENUM('TOILET_STATUS', 'ISSUE') NOT NULL,
    toilet_report_id BIGINT NULL,
    issue_report_id BIGINT NULL,
    owner_user_id BIGINT NULL,
    owner_fingerprint VARCHAR(100) NULL,
    storage_key VARCHAR(50) NOT NULL,
    media_type VARCHAR(30) NOT NULL,
    file_size BIGINT NOT NULL,
    created_at DATETIME NOT NULL,
    CONSTRAINT pk_report_image PRIMARY KEY (id),
    CONSTRAINT uk_report_image_storage_key UNIQUE (storage_key),
    CONSTRAINT fk_report_image_toilet_report FOREIGN KEY (toilet_report_id) REFERENCES toilet_report (id),
    CONSTRAINT fk_report_image_issue_report FOREIGN KEY (issue_report_id) REFERENCES issue_report (id),
    CONSTRAINT fk_report_image_user FOREIGN KEY (owner_user_id) REFERENCES app_user (id),
    CONSTRAINT chk_report_image_single_parent CHECK ((toilet_report_id IS NULL) <> (issue_report_id IS NULL)),
    INDEX idx_report_image_toilet_report (toilet_report_id),
    INDEX idx_report_image_issue_report (issue_report_id)
);

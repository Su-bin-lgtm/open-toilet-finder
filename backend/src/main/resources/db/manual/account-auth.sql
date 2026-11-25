-- Additive account authentication migration. Apply only to the chosen application database.
-- Does not backfill anonymous reports; their X-Device-Id lookup remains available.
CREATE TABLE app_user (
    id BIGINT NOT NULL AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL,
    password_hash VARCHAR(100) NOT NULL,
    created_at DATETIME NOT NULL,
    CONSTRAINT pk_app_user PRIMARY KEY (id),
    CONSTRAINT uk_app_user_username UNIQUE (username)
);

CREATE TABLE auth_session (
    token_hash VARCHAR(64) NOT NULL,
    user_id BIGINT NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME NOT NULL,
    CONSTRAINT pk_auth_session PRIMARY KEY (token_hash),
    CONSTRAINT fk_auth_session_user FOREIGN KEY (user_id) REFERENCES app_user (id),
    INDEX idx_auth_session_user (user_id),
    INDEX idx_auth_session_expiry (expires_at)
);

ALTER TABLE toilet_report
    ADD COLUMN user_id BIGINT NULL,
    ADD INDEX idx_toilet_report_user_created (user_id, created_at),
    ADD CONSTRAINT fk_toilet_report_user FOREIGN KEY (user_id) REFERENCES app_user (id);

ALTER TABLE issue_report
    ADD COLUMN user_id BIGINT NULL,
    ADD INDEX idx_issue_report_user_created (user_id, created_at),
    ADD CONSTRAINT fk_issue_report_user FOREIGN KEY (user_id) REFERENCES app_user (id);

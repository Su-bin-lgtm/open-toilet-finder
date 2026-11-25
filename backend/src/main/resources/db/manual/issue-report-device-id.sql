-- Apply once when issue_report.user_fingerprint does not exist.
-- Adds nullable device ownership metadata without changing existing rows.
ALTER TABLE issue_report
    ADD COLUMN user_fingerprint VARCHAR(100) NULL;

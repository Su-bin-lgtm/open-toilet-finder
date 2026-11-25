-- Additive migration: retains all existing issue rows and only adds review metadata.
ALTER TABLE issue_report
    ADD COLUMN review_memo VARCHAR(500) NULL,
    ADD COLUMN reviewed_at DATETIME NULL;

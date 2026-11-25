-- Follow-up for installations that applied an earlier VARCHAR version of report-image.sql.
-- This preserves rows and narrows the column to the two supported report types.
ALTER TABLE report_image
    MODIFY COLUMN report_kind ENUM('TOILET_STATUS', 'ISSUE') NOT NULL;

-- Safe correction after validating the official API's actual DAT_CRTR_YMD length.
-- Apply only to open_toilet_devtest; preserves all existing values.
ALTER TABLE toilet MODIFY data_base_date VARCHAR(10) NULL;

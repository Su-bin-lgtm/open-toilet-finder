-- The official API returns DAT_UPDT_PNT in a 19-character timestamp representation.
-- Apply only to open_toilet_devtest; this widens checkpoint storage without removing data.
ALTER TABLE public_restroom_sync_state MODIFY last_incremental_point VARCHAR(19) NULL;

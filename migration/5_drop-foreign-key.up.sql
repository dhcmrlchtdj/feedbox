BEGIN;

ALTER TABLE r_user_feed DROP CONSTRAINT IF EXISTS r_user_feed_feed_id_fkey;
ALTER TABLE r_user_feed DROP CONSTRAINT IF EXISTS r_user_feed_user_id_fkey;

COMMIT;

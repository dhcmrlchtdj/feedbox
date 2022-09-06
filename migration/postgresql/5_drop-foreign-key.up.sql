BEGIN;

ALTER TABLE r_user_feed DROP CONSTRAINT IF EXISTS r_user_feed_fid_fkey;
ALTER TABLE r_user_feed DROP CONSTRAINT IF EXISTS r_user_feed_uid_fkey;

COMMIT;

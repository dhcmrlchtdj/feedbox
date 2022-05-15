BEGIN;

ALTER TABLE r_user_feed ADD CONSTRAINT r_user_feed_feed_id_fkey FOREIGN KEY (fid) REFERENCES feeds(id);
ALTER TABLE r_user_feed ADD CONSTRAINT r_user_feed_user_id_fkey FOREIGN KEY (uid) REFERENCES users(id);

COMMIT;

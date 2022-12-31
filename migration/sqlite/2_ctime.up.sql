ALTER TABLE users ADD COLUMN ctime TEXT DEFAULT NULL;
UPDATE users SET ctime = CURRENT_TIMESTAMP;
ALTER TABLE feeds ADD COLUMN ctime TEXT DEFAULT NULL;
UPDATE feeds SET ctime = CURRENT_TIMESTAMP;
ALTER TABLE links ADD COLUMN ctime TEXT DEFAULT NULL;
UPDATE links SET ctime = CURRENT_TIMESTAMP;
ALTER TABLE r_feed_link ADD COLUMN ctime TEXT DEFAULT NULL;
UPDATE r_feed_link SET ctime = CURRENT_TIMESTAMP;
ALTER TABLE r_user_feed ADD COLUMN ctime TEXT DEFAULT NULL;
UPDATE r_user_feed SET ctime = CURRENT_TIMESTAMP;

PRAGMA writable_schema = on;
UPDATE sqlite_master
SET sql = replace(sql, 'DEFAULT NULL', 'DEFAULT CURRENT_TIMESTAMP')
WHERE type = 'table'
AND (name = 'users' or name='feeds' or name='links' or name='r_user_feed' or name='r_feed_link');
PRAGMA writable_schema = off;

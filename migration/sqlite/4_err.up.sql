CREATE TABLE new_feeds (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	url TEXT NOT NULL UNIQUE,
	updated INTEGER,
	etag TEXT NOT NULL DEFAULT '',
	ctime TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
	err TEXT NOT NULL DEFAULT '',
	errtime INTEGER
) STRICT;

INSERT INTO new_feeds (id, url, updated, etag, ctime)
SELECT id, url, updated, etag, ctime FROM feeds;

DROP TABLE feeds;

ALTER TABLE new_feeds RENAME TO feeds;

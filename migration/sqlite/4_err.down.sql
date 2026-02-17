CREATE TABLE old_feeds (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	url TEXT NOT NULL UNIQUE,
	updated INTEGER,
	etag TEXT NOT NULL DEFAULT '',
	ctime TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
) STRICT;

INSERT INTO old_feeds (id, url, updated, etag, ctime)
SELECT id, url, updated, etag, ctime FROM feeds;

DROP TABLE feeds;

ALTER TABLE old_feeds RENAME TO feeds;

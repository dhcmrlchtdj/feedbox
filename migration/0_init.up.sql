BEGIN;

CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    platform TEXT NOT NULL,
    pid TEXT NOT NULL,
    addition BLOB NOT NULL DEFAULT (x'7b7d'), -- x'{}'
    UNIQUE (platform, pid)
) STRICT;

CREATE TABLE feeds (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT NOT NULL UNIQUE,
    updated INTEGER
) STRICT;

CREATE TABLE links (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT NOT NULL UNIQUE
) STRICT;

create table r_feed_link (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    feed_id INTEGER NOT NULL,
    link_id INTEGER NOT NULL,
    UNIQUE(feed_id, link_id)
) STRICT;

CREATE TABLE r_user_feed (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    feed_id INTEGER NOT NULL,
    UNIQUE(user_id, feed_id)
) STRICT;

COMMIT;

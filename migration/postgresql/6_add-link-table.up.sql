BEGIN;

CREATE TABLE links (
    id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    url TEXT NOT NULL COLLATE "C" UNIQUE
);

CREATE TABLE r_feed_link (
    id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    feed_id INT NOT NULL,
    link_id INT NOT NULL,
    UNIQUE(feed_id, link_id)
);

COMMIT;
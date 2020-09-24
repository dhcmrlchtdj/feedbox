BEGIN;

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    platform VARCHAR(64) NOT NULL,
    pid VARCHAR(256) NOT NULL,
    addition JSONB NOT NULL DEFAULT '{}'::jsonb,
    UNIQUE (platform, pid)
);

CREATE TABLE feeds (
    id SERIAL PRIMARY KEY,
    url VARCHAR(2048) NOT NULL UNIQUE,
    updated TIMESTAMPTZ,
    links JSONB NOT NULL DEFAULT '[]'::jsonb
);

CREATE TABLE r_user_feed (
    id SERIAL PRIMARY KEY,
    uid INT NOT NULL REFERENCES users(id),
    fid INT NOT NULL REFERENCES feeds(id),
    UNIQUE(uid, fid)
);

COMMIT;

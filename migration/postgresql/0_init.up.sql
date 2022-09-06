BEGIN;

CREATE TABLE users (
    id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    platform VARCHAR(64) NOT NULL,
    pid VARCHAR(256) NOT NULL,
    addition JSONB NOT NULL DEFAULT '{}'::jsonb,
    UNIQUE (platform, pid)
);

CREATE TABLE feeds (
    id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    url VARCHAR(2048) NOT NULL UNIQUE,
    updated TIMESTAMPTZ,
    links JSONB NOT NULL DEFAULT '[]'::jsonb
);

CREATE TABLE r_user_feed (
    id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    uid INT NOT NULL REFERENCES users(id),
    fid INT NOT NULL REFERENCES feeds(id),
    UNIQUE(uid, fid)
);

COMMIT;

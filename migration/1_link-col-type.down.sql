BEGIN;

ALTER TABLE feeds ADD COLUMN links JSONB DEFAULT '[]'::jsonb;

CREATE PROCEDURE array2json() AS $$
    DECLARE
        fid int;
    BEGIN
        FOR fid IN
            SELECT id FROM feeds
        LOOP
            UPDATE feeds SET links =
            (SELECT json_agg(x)
                FROM feeds, unnest(feeds.link) AS x
                WHERE id = fid)
            WHERE id = fid;
        END LOOP;
    END;
$$ LANGUAGE plpgsql;
CALL array2json();
DROP PROCEDURE array2json;

UPDATE feeds SET links = '[]'::jsonb WHERE links is NULL;
ALTER TABLE feeds ALTER COLUMN links SET NOT NULL;

ALTER TABLE feeds DROP COLUMN link;

COMMIT;

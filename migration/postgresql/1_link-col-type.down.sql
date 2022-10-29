BEGIN;

ALTER TABLE feeds ADD COLUMN links JSONB DEFAULT '[]'::jsonb;

CREATE PROCEDURE array2json() AS $$
	DECLARE
		fid INT;
	BEGIN
		FOR fid IN
		SELECT id FROM feeds
		LOOP
			UPDATE feeds SET links =
			(SELECT JSON_AGG(x)
				FROM feeds, UNNEST(feeds.link) AS x
				WHERE id = fid)
			WHERE id = fid;
		END LOOP;
	END;
$$ LANGUAGE plpgsql;
CALL array2json();
DROP PROCEDURE array2json;

UPDATE feeds SET links = '[]'::jsonb WHERE links IS NULL;
ALTER TABLE feeds ALTER COLUMN links SET NOT NULL;

ALTER TABLE feeds DROP COLUMN link;

COMMIT;

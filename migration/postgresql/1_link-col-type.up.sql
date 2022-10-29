BEGIN;

ALTER TABLE feeds ADD COLUMN link VARCHAR(2000)[] DEFAULT ARRAY[]::VARCHAR[];

CREATE PROCEDURE json2array() AS $$
	DECLARE
		fid INT;
	BEGIN
		FOR fid IN
			SELECT id FROM feeds
		LOOP
			UPDATE feeds SET link =
			(SELECT array_agg(x)
				FROM feeds, jsonb_array_elements_text(feeds.links) AS x
				WHERE id = fid)
			WHERE id = fid;
		END LOOP;
	END;
$$ LANGUAGE plpgsql;
CALL json2array();
DROP PROCEDURE json2array;

UPDATE feeds SET link = ARRAY[]::VARCHAR[] WHERE link IS NULL;
ALTER TABLE feeds ALTER COLUMN link SET NOT NULL;

ALTER TABLE feeds DROP COLUMN links;

COMMIT;

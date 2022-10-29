BEGIN;

ALTER TABLE r_user_feed RENAME user_id TO uid;
ALTER TABLE r_user_feed RENAME feed_id TO fid;

ALTER TABLE feeds ADD COLUMN link TEXT[] COLLATE "C" DEFAULT ARRAY[]::TEXT[];

CREATE PROCEDURE moveToLinksColumn() AS $$
	DECLARE
		fid INT;
	BEGIN
		FOR fid IN
			SELECT id FROM feeds
		LOOP
			UPDATE feeds SET link = (
				SELECT ARRAY_AGG(url) FROM links
				JOIN r_feed_link ON links.id = r_feed_link.link_id
				WHERE r_feed_link.feed_id = fid
			)
			WHERE id = fid;
		END LOOP;
	END;
$$ LANGUAGE plpgsql;
CALL moveToLinksColumn();
DROP PROCEDURE moveToLinksColumn;

DROP TABLE IF EXISTS r_feed_link;
DROP TABLE IF EXISTS links;

COMMIT;

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

CREATE PROCEDURE moveToLinksTable() AS $$
	DECLARE
		fid INT;
	BEGIN
		FOR fid IN
			SELECT id FROM feeds
		LOOP
			INSERT INTO links(url)
			SELECT UNNEST(link) FROM feeds WHERE id = fid
			ON CONFLICT DO NOTHING;

			WITH linkCol(feed_id, link) AS (
				SELECT fid, UNNEST(link) FROM feeds WHERE id = fid
			),
			linkId(feed_id, link_id) AS (
				SELECT linkCol.feed_id, links.id FROM links
				JOIN linkCol ON links.url = linkCol.link
				WHERE linkCol.feed_id = fid
			)
			INSERT INTO r_feed_link(feed_id, link_id)
			SELECT feed_id, link_id FROM linkId
			ON CONFLICT DO NOTHING;
		END LOOP;
	END;
$$ LANGUAGE plpgsql;
CALL moveToLinksTable();
DROP PROCEDURE moveToLinksTable;

ALTER TABLE feeds DROP COLUMN link;

ALTER TABLE r_user_feed RENAME uid TO user_id;
ALTER TABLE r_user_feed RENAME fid TO feed_id;

COMMIT;

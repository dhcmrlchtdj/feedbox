import { db } from '../server/models/connection'

export const up = (next) => {
    db.tx(async (t) => {
        await t.none(
            `ALTER TABLE feeds ADD COLUMN link VARCHAR(2000)[] DEFAULT ARRAY[]::VARCHAR[]`,
        )

        const ids = await t.manyOrNone<{ id: number }>(`SELECT id FROM feeds`)
        for (const id in ids) {
            await t.none(
                `UPDATE feeds SET link =
                (SELECT array_agg(x) FROM feeds, jsonb_array_elements_text(feeds.links) AS x WHERE id = $1)
                WHERE id = $1`,
                [id],
            )
        }

        await t.none(`UPDATE feeds SET link = ARRAY[]::VARCHAR[] WHERE link is NULL`)
        await t.none(`ALTER TABLE feeds ALTER COLUMN link SET NOT NULL`)

        await t.none(`ALTER TABLE feeds DROP COLUMN links`)
    }).then(() => next())
}

export const down = (next) => {
    db.tx(async (t) => {
        await t.none(
            `ALTER TABLE feeds ADD COLUMN links JSONB DEFAULT '[]'::jsonb`,
        )

        const ids = await t.manyOrNone<{ id: number }>(`SELECT id FROM feeds`)
        for (const id in ids) {
            await t.none(
                `UPDATE feeds SET links =
                (SELECT json_agg(x) FROM feeds, unnest(feeds.link) AS x WHERE id = $1)
                WHERE id = $1`,
                [id],
            )
        }

        await t.none(`UPDATE feeds SET links = '[]'::jsonb WHERE links is NULL`)
        await t.none(`ALTER TABLE feeds ALTER COLUMN links SET NOT NULL`)

        await t.none(`ALTER TABLE feeds DROP COLUMN link`)
    }).then(() => next())
}

import * as Knex from 'knex'

export const up = (knex: Knex) => {
    return knex.schema.table('feedbox_feed', (table) => {
        table.jsonb('links').defaultTo('[]')
    })
}

export const down = (knex: Knex) => {
    return knex.schema.alterTable('feedbox_feed', (table) => {
        table.dropColumn('links')
    })
}

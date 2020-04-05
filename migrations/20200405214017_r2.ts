import * as Knex from 'knex'

export const up = (knex: Knex) => {
    return knex.schema.dropTable('feedbox_link')
}

export const down = (knex: Knex) => {
    return knex.schema.createTable('feedbox_link', (table) => {
        table.increments('id')
        table.dateTime('created_at').defaultTo(knex.fn.now())
        table.string('url', 2048).notNullable()
        table.integer('feed_id').unsigned()
        table.foreign('feed_id').references('feedbox_feed.id')
    })
}

import * as Knex from 'knex'

export const up = (knex: Knex) => {
    return knex.schema
        .createTable('feedbox_user', table => {
            table.increments('id')
            table.dateTime('created_at').defaultTo(knex.fn.now())
            table
                .string('email', 2048)
                .notNullable()
                .unique()
            table
                .integer('github_id')
                .notNullable()
                .unique()
        })
        .createTable('feedbox_feed', table => {
            table.increments('id')
            table.dateTime('created_at').defaultTo(knex.fn.now())
            table
                .string('url', 2048)
                .notNullable()
                .unique()
            table
                .dateTime('updated')
                .nullable()
                .defaultTo(null)
        })
        .createTable('feedbox_link', table => {
            table.increments('id')
            table.dateTime('created_at').defaultTo(knex.fn.now())
            table.integer('url', 255).notNullable()
            table.integer('feed_id').unsigned()
            table.foreign('feed_id').references('feedbox_feed.id')
        })
        .createTable('feedbox_r_user_feed', table => {
            table.increments('id')
            table.dateTime('created_at').defaultTo(knex.fn.now())
            table.integer('user_id').unsigned()
            table.integer('feed_id').unsigned()
            table.unique(['user_id', 'feed_id'])
            table.foreign('user_id').references('feedbox_user.id')
            table.foreign('feed_id').references('feedbox_feed.id')
        })
}

export const down = (knex: Knex) => {
    return knex.schema
        .dropTable('feedbox_r_user_feed')
        .dropTable('feedbox_link')
        .dropTable('feedbox_feed')
        .dropTable('feedbox_user')
}

export const config = { transaction: false }

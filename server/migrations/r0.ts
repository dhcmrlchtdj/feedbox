import * as Knex from 'knex'

export const up = (knex: Knex) => {
    return knex.schema
        .createTable('User', table => {
            table.increments('id')
            table.dateTime('created_at').defaultTo(knex.fn.now())
            table
                .integer('github_id')
                .notNullable()
                .unique()
            table
                .string('email', 255)
                .notNullable()
                .unique()
        })
        .createTable('Feed', table => {
            table.increments('id')
            table.dateTime('created_at').defaultTo(knex.fn.now())
            table
                .string('url', 255)
                .notNullable()
                .unique()
            table
                .dateTime('latest_checked')
                .nullable()
                .defaultTo(null)
            table
                .dateTime('latest_updated')
                .nullable()
                .defaultTo(null)
        })
        .createTable('Link', table => {
            table.increments('id')
            table.dateTime('created_at').defaultTo(knex.fn.now())
            table.integer('url', 255).notNullable()
            table.integer('feed_id').unsigned()
            table.foreign('feed_id').references('Feed.id')
        })
        .createTable('RUserFeed', table => {
            table.increments('id')
            table.dateTime('created_at').defaultTo(knex.fn.now())
            table.integer('user_id').unsigned()
            table.integer('feed_id').unsigned()
            table.unique(['user_id', 'feed_id'])
            table.foreign('user_id').references('User.id')
            table.foreign('feed_id').references('Feed.id')
        })
}

export const down = (knex: Knex) => {
    return knex.schema
        .dropTable('RUserFeed')
        .dropTable('Link')
        .dropTable('Feed')
        .dropTable('User')
}

export const config = { transaction: false }

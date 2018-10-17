// setup sqlite database (each migration step will only run once)

import * as promptly from "promptly";
import Store = require("openrecord/store/sqlite3");

async function migrateDatabase() {
    const answer = await promptly.confirm(
        "This will SETUP AND ALTER TABLES in the animeshot database to current version, make sure you have backed up the sqlite file, PROCEED? (y/n)",
    );

    if (!answer) {
        console.log("database setup and migration aborted");
        return;
    }

    const db = new Store({
        file: "../../src/database/feedbox.sqlite",
        autoLoad: true,
        migrations: [
            require("../migrations/database_migration_r0"),
            require("../migrations/database_migration_r1"),
        ],
    });

    await db.ready();

    console.log("database setup and migration done");
    db.close();
}

migrateDatabase().catch(err => {
    console.log(err);
});

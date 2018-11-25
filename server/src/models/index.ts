import * as path from "path";
import { createConnection } from "typeorm";
import User from "./user";
import Feed from "./feed";

const initDB = async (): Promise<void> => {
    const base = {
        entities: [User, Feed],
        // maxQueryExecutionTime: 1000,
        // logging: true,
        logger: "simple-console",
        synchronize: true,
    };
    const sqlite = Object.assign(
        {
            type: "sqlite",
            database: path.resolve(
                __dirname,
                "../../src/databases/feedbox.sqlite",
            ),
        },
        base,
    );
    const postgres = Object.assign(
        {
            type: "postgres",
            url: process.env.DATABASE_URL,
        },
        base,
    );
    const config = process.env.NODE_ENV === "production" ? postgres : sqlite;
    await createConnection(config as any);
};

export default initDB;

import * as path from "path";
import { createConnection } from "typeorm";
import User from "./user";
import Feed from "./feed";

// import { getConnection } from "typeorm";

const initDB = async () => {
    await createConnection({
        type: "sqlite",
        database: path.resolve(__dirname, "../../src/databases/feedbox.sqlite"),
        entities: [User, Feed],
        maxQueryExecutionTime: 1000,
        logging: true,
        logger: "simple-console",
        synchronize: true,
    });
};

export default initDB;
export { User, Feed };

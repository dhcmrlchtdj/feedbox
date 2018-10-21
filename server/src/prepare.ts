import "reflect-metadata";
import * as dotenv from "dotenv";
import * as path from "path";
import initDB from "./models";

process.on("unhandledRejection", err => {
    console.error(err);
    process.exit(1);
});

dotenv.config({
    path: path.resolve(__dirname, "../dotenv"),
});

export default async () => {
    await initDB();
};

import "reflect-metadata";
import * as path from "path";
import * as dotenv from "dotenv";
import * as Sentry from "@sentry/node";
import initDB from "./models";

process.on("unhandledRejection", err => {
    console.error(err);
    process.exit(1);
});

dotenv.config({
    path: path.resolve(__dirname, "../dotenv"),
});

export default async (): Promise<void> => {
    Sentry.init({ dsn: process.env.SENTRY_DSN });
    await initDB();
};

import "reflect-metadata";
import { DataSource } from "typeorm";
import dotenv from "dotenv";
import * as entities from "./entities"

dotenv.config();

const isProduction = process.env.NODE_ENV === "production";
const isTestEnv = process.env.NODE_ENV === "test";

export const AppDataSource = new DataSource({
    type: isTestEnv? "sqlite": "mysql",
    host: isTestEnv? undefined: process.env.DB_HOST!,
    port: isTestEnv? undefined: parseInt(process.env.DB_PORT || "3306"),
    username: isTestEnv? undefined: process.env.DB_USER!,
    password: isTestEnv? undefined: process.env.DB_PASSWORD!,
    database: isTestEnv? `:memory:${process.env.JEST_WORKER_ID}`: process.env.DB_NAME!,
    synchronize: isTestEnv,
    logging: !isTestEnv && !isProduction,
    entities: Object.values(entities),
    migrations: ["dist/migration/*.js"],
});
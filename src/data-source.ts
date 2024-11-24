import "reflect-metadata";
import { DataSource } from "typeorm";
import dotenv from "dotenv";

dotenv.config();

const isProduction = process.env.NODE_ENV === "production";
const isTestEnv = process.env.NODE_ENV === "test";

export const AppDataSource = new DataSource({
    type: isTestEnv? "sqlite": "mysql",
    host: isTestEnv? undefined: process.env.DB_HOST!,
    port: isTestEnv? undefined: parseInt(process.env.DB_PORT || "3306"),
    username: isTestEnv? undefined: process.env.DB_USER!,
    password: isTestEnv? undefined: process.env.DB_PASSWORD!,
    database: isTestEnv? ":memory": process.env.DB_NAME!,
    synchronize: isTestEnv,
    logging: !isTestEnv && !isProduction,
    entities: [isProduction ? "dist/entities/*.js" : "src/entities/*.ts"],
    migrations: ["dist/migration/*.js"],
});
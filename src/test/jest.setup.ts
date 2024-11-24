import { AppDataSource } from "../data-source";

beforeAll(async () => {
    await AppDataSource.initialize();
    console.log("Test database initialized!");
});

afterAll(async () => {
    await AppDataSource.destroy();
    console.log("Test database destroyed!");
});
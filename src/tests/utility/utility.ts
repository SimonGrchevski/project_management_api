import { Express } from "express";
import request, { Response } from "supertest";
import { AppDataSource } from "../../data-source";

export const logUser = async (
    app: Express,
    credentials: { username: string | undefined; password: string | undefined; email?: string | undefined }
): Promise<Response> => {
    return await request(app)
        .post("/auth/login")
        .send(credentials);
};

export const registerUser = async (
    app: Express,
    credentials: { username: string | undefined; password: string | undefined; email?: string | undefined }
): Promise<Response> => {
    return await request(app)
        .post("/auth/register")
        .send(credentials);
};

export const extractTokenFromCookie = (cookiesHeader: string | string[]): string | undefined => {
    const cookies = Array.isArray(cookiesHeader) ? cookiesHeader : [cookiesHeader].filter(Boolean);
    const tokenCookie = cookies.find((cookie: string) => cookie.startsWith("token="));
    return tokenCookie?.split(";")[0]?.split("=")[1];
};

export const dataDestroy = async (dataSource: typeof AppDataSource) => {
    if (dataSource.isInitialized) {
        await dataSource.destroy();
    }
}

export const cleanData = async (dataSource: typeof AppDataSource) => {
    const entities = dataSource.entityMetadatas;

    for (const entity of entities) {
        const repository = dataSource.getRepository(entity.name);
        await repository.query(`DELETE FROM ${entity.tableName};`);
        if (dataSource.options.type === "sqlite") {
            await repository.query(
                `DELETE FROM sqlite_sequence WHERE name='${entity.tableName}';`
            );
        }
    }
}

export const testUser = {
    username: "testuser",
    email: "testemail@email.com",
    password: "TestPassword123",
};

export const isValidId = (id:string) => /^[0-9]+$/.test(id);
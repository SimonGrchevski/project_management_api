import request from "supertest";
import app from "../app";
import { AppDataSource } from "../data-source";
import { User } from "../entities/User";

describe("Auth API", () => {

    beforeEach(async () => {
        const entities = AppDataSource.entityMetadatas;
        for (const entity of entities) {
            const repository = AppDataSource.getRepository(entity.name);
            await repository.query(`DELETE FROM ${entity.tableName};`);
            if (AppDataSource.options.type === "sqlite") {
                await repository.query(`DELETE FROM sqlite_sequence WHERE name='${entity.tableName}';`);
            }
        }
    });

    it("Should register a new user successfully", async() => {
        const response = await request(app)
        .post("/auth/register")
        .send({
            username:"testuser",
            password:"testpassword",
            email:"testemail@temail.com"
        });

        expect(response.status).toBe(201);
        expect(response.body).toStrictEqual( {
            id:1,
            username:"testuser"
        });
    });
})
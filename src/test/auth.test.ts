import request from "supertest";
import app from "../app";
import { AppDataSource } from "../data-source";
import { User } from "../entities/User";

describe("Auth API", () => {

    let testUser: { username: string; email: string; password: string };
    beforeAll(() => {
        testUser = {
            username:"testuser", 
            email:"testemail@email.com", 
            password:"testpassword123"
        };
    });

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
        .send(testUser);

        expect(response.status).toBe(201);
        expect(response.body).toStrictEqual( {
            id:1,
            username:"testuser"
        });
    });

    it("Should return error for duplicate username or email", async () => {
       await request(app)
            .post("/auth/register")
            .send(testUser);

        const response = await request(app)
            .post("/auth/register")
            .send(testUser);

        expect(response.status).toBe(400);
        expect(response.body).toStrictEqual({
            msg:"username or email is already used"
        });
    })

    // it("Should fail when email is invalid", async () => {
    //     const response = await request(app)
    //          .post("/auth/register")
    //          .send({...testUser, email:"invalid"});
 
    //     //  expect(response.status).toBe(400);
    //      expect(response.body).toStrictEqual({
    //          msg:"Invalid email"
    //      });
    //  })

})
import request from "supertest";
import { createApp } from "../app";
import { AppDataSource } from "../data-source";
import { Express } from "express";

describe("auth/login", () => {
    let expressApp: Express;
    let dataSource: typeof AppDataSource;
    let testUser: { username: string; email: string; password: string };

    beforeAll(async () => {
        const appWithDataSource = createApp();
        expressApp = appWithDataSource.app;
        dataSource = appWithDataSource.dataSource;

        await dataSource.initialize();
        
        testUser = {
            username: "testuser",
            email: "testemail@email.com",
            password: "TestPassword123",
        };

        await request(expressApp)
                .post("/auth/register")
                .send(testUser);
    });

    afterAll(async () => {
        if (dataSource.isInitialized) {
            await dataSource.destroy();
        }
    });

    afterEach(async () => {
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
    });
    
    describe("username", () => {
        it("Should login successfully", async () => {
            const response = await request(expressApp)
                .post("/auth/login")
                .send(testUser);

            expect(response.status).toBe(200);
        });

        it("Should fail logging because the username is undefined", async () => {
            const response = await request(expressApp)
                .post("/auth/login")
                .send({...testUser, username:undefined});

            expect(response.status).toBe(400);

            expect(response.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        msg: "Username is required",
                        path: "username",
                    }),
                ])
            );
        });

        it("Should fail logging because the username is empty string", async () => {
            const response = await request(expressApp)
                .post("/auth/login")
                .send({...testUser, username:""});

            expect(response.status).toBe(400);

            expect(response.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        msg: "Username is required",
                        path: "username",
                    }),
                ])
            );
        });

        it("Should fail logging because the username is with special characters", async () => {
            const response = await request(expressApp)
                .post("/auth/login")
                .send({...testUser, username:"1 woork h4@rd"});

            expect(response.status).toBe(400);

            expect(response.body.errors).toContainEqual(
                expect.objectContaining({
                    msg: "Invalid credentials",
                    path: "username",
                })
            );
        });

        it("Should fail logging because the username is long", async () => {
            const response = await request(expressApp)
                .post("/auth/login")
                .send({...testUser, username: "a".repeat(256)} );

            expect(response.status).toBe(400);

            expect(response.body.errors).toContainEqual(
                expect.objectContaining({
                    msg: "Invalid credentials",
                    path: "username",
                })
            );
        });

    });

    describe("password", () => {

        it("Should fail when  password is < then 8 characters", async () => {
            const response = await request(expressApp)
                .post("/auth/login")
                .send({...testUser, password: "User1"} );

            expect(response.status).toBe(400);

            expect(response.body.errors).toContainEqual(
                expect.objectContaining({
                    msg: "Invalid credentials",
                    path: "password",
                })
            );
        });

        it("Should fail when password is nonexistent", async () => {
            const response = await request(expressApp)
                .post("/auth/login")
                .send({...testUser, password:undefined} );

            expect(response.status).toBe(400);

            expect(response.body.errors).toContainEqual(
                expect.objectContaining({
                    msg: "Password is required",
                    path: "password",
                })
            );
        });

        it("Should fail when password is without uppercase letter", async () => {
            const response = await request(expressApp)
                .post("/auth/login")
                .send({...testUser, password:"testuser"} );

            expect(response.status).toBe(400);

            expect(response.body.errors).toContainEqual(
                expect.objectContaining({
                    msg: "Invalid credentials",
                    path: "password",
                })
            );
        });

        it("Should fail when password is without a single digit", async () => {
            const response = await request(expressApp)
                .post("/auth/login")
                .send({...testUser, password:"Testuser"} );

            expect(response.status).toBe(400);

            expect(response.body.errors).toContainEqual(
                expect.objectContaining({
                    msg: "Invalid credentials",
                    path: "password",
                })
            );
        });
    });
});

import request from "supertest";
// import app.app from "../app.app";
import { createApp } from "../app";
import { AppDataSource } from "../data-source";
import { User } from "../entities/User";
import bcrypt from "bcrypt"
import { Express } from "express";
import { rateLimiterMiddleware } from "../middlewares/rateLimiterMiddleware";

interface AppWithDataSource {
    app: Express;
    dataSource: typeof AppDataSource;
}

describe("Auth API", () => {

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
    });

    afterAll(async () => {
        if (dataSource.isInitialized) {
            await dataSource.destroy();
        }
    });

    afterEach(async() => {

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

    beforeEach(async () => {
        rateLimiterMiddleware.resetKey("test-client");
    });

    it("Should register a new user successfully", async() => {
        const response = await request(expressApp)
        .post("/auth/register")
        .send(testUser);

        expect(response.status).toBe(201);
        expect(response.body).toStrictEqual( {
            id:1,
            username:"testuser"
        });
    });

    it("Should return error for duplicate username or email", async () => {
       await request(expressApp)
            .post("/auth/register")
            .send(testUser);

        const response = await request(expressApp)
            .post("/auth/register")
            .send(testUser);

        expect(response.status).toBe(400);
        expect(response.body).toStrictEqual({
            msg:"username or email is already used"
        });
    })

    it("Should return error for duplicate username with different cases", async () => {
        await request(expressApp)
             .post("/auth/register")
             .send(testUser);
 
         const response = await request(expressApp)
             .post("/auth/register")
             .send({...testUser, username: "TESTUSER"});
 
         expect(response.status).toBe(400);
         expect(response.body).toStrictEqual({
             msg:"username or email is already used"
         });
    })

    it("Should return error for duplicate email with different cases", async () => {
        await request(expressApp)
             .post("/auth/register")
             .send(testUser);
 
         const response = await request(expressApp)
             .post("/auth/register")
             .send({...testUser, email:"TEStEMaiL@email.com"});
 
         expect(response.status).toBe(400);
         expect(response.body).toStrictEqual({
             msg:"username or email is already used"
         });
    });

    it("Should fail if the request body is empty", async () => {
        const response = await request(expressApp)
            .post("/auth/register")
            .send({});
        expect(response.status).toBe(400);
        expect(response.body.errors).toEqual(
            expect.arrayContaining([
                    expect.objectContaining({ msg: "Username is required"}),
                    expect.objectContaining({ msg: "Invalid email format"}),
                    expect.objectContaining({ msg: "Password must be at least 8 characters long"}),
                    expect.objectContaining({ msg: "Invalid email format", path: "email" }),
                ])
        )
    });

    it("Should store a hashed password", async () => {
        const response = await request(expressApp)
            .post("/auth/register")
            .send(testUser);

        const user = await dataSource.getRepository(User).findOneBy({
            username:testUser.username
        });

        expect(user).not.toBeNull();
        expect(user!.password).not.toBe(testUser.password);
    })

    it("Should store a correct hashed password", async () => {
        const response = await request(expressApp)
            .post("/auth/register")
            .send(testUser);

        const user = await dataSource.getRepository(User).findOneBy({
            username:testUser.username
        });

        const isValid = await bcrypt.compare(testUser.password, user!.password);
        expect(isValid).toBe(true);
    });

    it("Should fail if required fields are missing", async () => {
        const response = await request(expressApp)
            .post("/auth/register")
            .send({username:"username"});
 
        expect(response.status).toBe(400);
        expect(response.body.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ msg: "Password must be at least 8 characters long", path: "password" }),
                expect.objectContaining({ msg: "Password must contain at least one uppercase letter", path: "password" }),
                expect.objectContaining({ msg: "Password must contain at least one number", path: "password" }),
                expect.objectContaining({ msg: "Invalid email format", path: "email" }),
            ])
        );
    });

    it("Should fail when email is invalid", async () => {
        const response = await request(expressApp)
             .post("/auth/register")
             .send({...testUser, email:"invalid"});
 
         expect(response.status).toBe(400);
         expect(response.body.errors[0].msg).toBe("Invalid email format");
    });

    it("Should fail when username is empty", async () => {
        const response = await request(expressApp)
             .post("/auth/register")
             .send({...testUser, username:""});
 
         expect(response.status).toBe(400);
         expect(response.body.errors[0].msg).toBe("Username is required");
    });

    it("Shouldn't allow special characters on username", async () => {
        const response = await request(expressApp)
            .post("/auth/register")
            .send({
                username: "user!@#",
                password: "@test#uSer!on%1",
                email: "valid.email@example.com",
            });
        expect(response.status).toBe(400);
        expect(response.body.errors[0].msg).toBe("Username must contain only letters and numbers");

    });

    it("Shouldn't fail if password contains special characters", async () => {
        const response = await request(expressApp)
            .post("/auth/register")
            .send({...testUser, password:"A2d#$@!@#$%&*^%$"});

        expect(response.status).toBe(201);
        expect(response.body).toStrictEqual( {
            id:1,
            username:"testuser"
        });
    });

    it("Should fail when password is less then 8 characters", async () => {
        const response = await request(expressApp)
             .post("/auth/register")
             .send({...testUser, password:"I0"});
 
         expect(response.status).toBe(400);
         expect(response.body.errors[0].msg).toBe("Password must be at least 8 characters long");
    });

    it("Should fail when password is without uppercase letter", async () => {
        const response = await request(expressApp)
             .post("/auth/register")
             .send({...testUser, password:"testpassword123"});
 
         expect(response.status).toBe(400);
         expect(response.body.errors[0].msg).toBe("Password must contain at least one uppercase letter");
    });

    it("Should reject requests with excessively long inputs", async () => {
        const response = await request(expressApp)
            .post("/auth/register")
            .send({...testUser, username: "a".repeat(256)});
        expect(response.status).toBe(400);
        expect(response.body.errors[0].msg).toBe("No excessively long inputs allowed");
    });

    it("Should fail when password is without at least one numerical character", async () => {
        const response = await request(expressApp)
             .post("/auth/register")
             .send({...testUser, password:"TestPassword"});
 
         expect(response.status).toBe(400);
         expect(response.body.errors[0].msg).toBe("Password must contain at least one number");
    });

    it("Should trim the whitespace of the username", async () => {
        const response = await request(expressApp)
             .post("/auth/register")
             .send({...testUser, username:"  testuser  "});
 
         expect(response.status).toBe(201);
         expect(response.body.username).toBe("testuser");
    });

    it("Should trim the whitespace of the email", async () => {
        const response = await request(expressApp)
             .post("/auth/register")
             .send({...testUser, email:" testemail@email.com  "});
 
         expect(response.status).toBe(201);

         const user = await dataSource.getRepository(User).findOneBy({username:testUser.username});
         expect(user?.email).toBe("testemail@email.com");
    });

    it("Should fail if request contains malformed JSON", async () => {
        const response = await request(expressApp)
            .post("/auth/register")
            .set("Content-Type", "application/json")
            .send('{username: testuser, password: Testpassword1, email: testemail.com}');
        expect(response.status).toBe(400);
        expect(response.body.msg).toBe("Invalid JSON payload");
    });

    it("Should fail after too many requests in a short period", async() => {
        for(let i = 0; i < 10; i++) {
            const res = await request(expressApp)
                .post("/auth/register")
                .send({
                    username: `Username${i}`,
                    password: "123Username",
                    email: `testemail${i}@testmail.com`
                })

            expect(res.status).toBe(201);
        };

        const res = await request(expressApp)
            .post("/auth/register")
            .send(testUser)
        
        expect(res.status).toBe(429);
        expect(res.body.msg).toBe("Too many requests, please try again later");
    })
});


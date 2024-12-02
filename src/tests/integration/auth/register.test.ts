import request from "supertest";
import TestApp from "../../utility/testApp";
import { AppDataSource } from "../../../data-source";
import { User } from "../../../entities/User";
import bcrypt from "bcrypt";
import { Express } from "express";
import { rateLimiterManager } from "../../../middlewares/rateLimiterManager";
import { RATE_LIMIT_CONFIG } from "../../../config/constants";
import {registerUser, testUser } from "../../utility/utility";

describe("Auth API", () => {
    let expressApp: Express;
    let dataSource: typeof AppDataSource;

    beforeAll(async () => {
        const appWithData = await TestApp.getInstance();
        await TestApp.cleanData();
        expressApp = appWithData.app;
        dataSource = appWithData.dataSource;
    });

    afterAll(async () => {
        await TestApp.cleanup();
    });

    afterEach(async () => {
        await TestApp.cleanData();
    });

    beforeEach(async () => {
        rateLimiterManager.resetAllKeys();
    });

    describe("Registration Success", () => {
        it("Should register a new user successfully", async () => {
            const response = await registerUser(expressApp, testUser);

            expect(response.status).toBe(201);
            expect(response.body).toStrictEqual({
                id: 1,
                username: "testuser",
            });
        });

        it("Should store a hashed password", async () => {
            await registerUser(expressApp, testUser);

            const user = await dataSource.getRepository(User).findOneBy({
                username: testUser.username,
            });

            expect(user).not.toBeNull();
            expect(user!.password).not.toBe(testUser.password);
        });

        it("Should store a correct hashed password", async () => {
            await registerUser(expressApp, testUser);

            const user = await dataSource.getRepository(User).findOneBy({
                username: testUser.username,
            });

            const isValid = await bcrypt.compare(testUser.password, user!.password);
            expect(isValid).toBe(true);
        });

        it("Should trim the whitespace of the username", async () => {
            const response = await registerUser(
                expressApp,
                { ...testUser, username: "  testuser  " }
            );


            expect(response.status).toBe(201);
            expect(response.body.username).toBe("testuser");
        });

        it("Should trim the whitespace of the email", async () => {
            const response = await registerUser(
                expressApp,
                { ...testUser, email: " testemail@email.com  " }
            );


            expect(response.status).toBe(201);

            const user = await dataSource.getRepository(User).findOneBy({
                username: testUser.username,
            });
            expect(user?.email).toBe("testemail@email.com");
        });

        it("Shouldn't fail if password contains special characters", async () => {
            const response = await registerUser(
                expressApp,
                { ...testUser, password: "A2d#$@!@#$%&*^%$" }
            );

            expect(response.status).toBe(201);
            expect(response.body).toStrictEqual({
                id: 1,
                username: "testuser",
            });
        });
    });

    describe("Registration Errors", () => {
        it("Should return error for duplicate username or email", async () => {
            await registerUser(expressApp, testUser);

            const response = await registerUser(expressApp, testUser);;

            expect(response.status).toBe(400);
            expect(response.body.message).toBe("username or email is already used");
        });

        it("Should return error for duplicate username with different cases", async () => {

            await registerUser(expressApp, testUser);

            const response = await registerUser(
                expressApp,
                { ...testUser, username: "TESTUSER" }
            );

            expect(response.status).toBe(400);
            expect(response.body.message).toBe("username or email is already used");
        });

        it("Should return error for duplicate email with different cases", async () => {

            await registerUser(expressApp, testUser);

            const response = await registerUser(
                expressApp,
                { ...testUser, email: "TEStEMaiL@email.com" }
            );

            expect(response.status).toBe(400);
            expect(response.body.message).toBe("username or email is already used");
        });

        it("Should fail if the request body is empty", async () => {
            const response = await registerUser(expressApp, {} as any);
            expect(response.status).toBe(400);
            expect(response.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ msg: "Username is required" }),
                    expect.objectContaining({ msg: "Invalid email format" }),
                    expect.objectContaining({ msg: "Password must be at least 8 characters long" }),
                ])
            );
        });

        it("Should fail if required fields are missing", async () => {

            const response = await registerUser(expressApp, { username: "username" } as any);
            expect(response.status).toBe(400);
            expect(response.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        msg: "Password must be at least 8 characters long",
                        path: "password",
                    }),
                    expect.objectContaining({
                        msg: "Invalid email format",
                        path: "email",
                    }),
                ])
            );
        });

        it("Should fail when email is invalid", async () => {
            const response = await registerUser(expressApp, { ...testUser, email: "invalid" });

            expect(response.status).toBe(400);
            expect(response.body.errors[0].msg).toBe("Invalid email format");
        });

        it("Should fail when username is empty", async () => {
            const response = await registerUser(expressApp, { ...testUser, username: "" });

            expect(response.status).toBe(400);
            expect(response.body.errors[0].msg).toBe("Username is required");
        });

        it("Should fail when username is undefined", async () => {
            const response = await registerUser(
                expressApp,
                {
                    email: "testemail@email.com",
                    password: "TestPassword123",
                } as any
            );

            expect(response.status).toBe(400);
            expect(response.body.errors[0].msg).toBe("Username is required");
        });

        it("Should reject excessively long inputs", async () => {
            const response = await registerUser(expressApp, { ...testUser, username: "a".repeat(256) });

            expect(response.status).toBe(400);
            expect(response.body.errors[0].msg).toBe("No excessively long inputs allowed");
        });

        it("Should fail if request contains malformed JSON", async () => {
            const response = await request(expressApp)
                .post("/auth/register")
                .set("Content-Type", "application/json")
                .send('{username: testuser, password: Testpassword1, email: testemail.com}');
            expect(response.status).toBe(400);
            expect(response.body.message).toBe("Invalid JSON payload");
        });
    });

    describe("Password Validation", () => {
        it("Should fail when password is less than 8 characters", async () => {
            const response = await registerUser(
                expressApp,
                { ...testUser, password: "I0" }
            );


            expect(response.status).toBe(400);
            expect(response.body.errors[0].msg).toBe(
                "Password must be at least 8 characters long"
            );
        });

        it("Should fail when password lacks uppercase letters", async () => {
            const response = await registerUser(
                expressApp,
                { ...testUser, password: "testpassword123" }
            );

            expect(response.status).toBe(400);
            expect(response.body.errors[0].msg).toBe(
                "Password must contain at least one uppercase letter"
            );
        });

        it("Should fail when password lacks numbers", async () => {
            const response = await registerUser(
                expressApp, { ...testUser, password: "TestPassword" }
            );

            expect(response.status).toBe(400);
            expect(response.body.errors[0].msg).toBe("Password must contain at least one number");
        });
    });

    describe("Rate Limiting", () => {
        it("Should fail after too many requests in a short period", async () => {
            for (let i = 0; i < RATE_LIMIT_CONFIG.MAX_REQUESTS; i++) {
                const res = await registerUser(
                    expressApp, {
                    username: `Username${i}`,
                    password: "123Username",
                    email: `testemail${i}@testmail.com`,
                }
                );

                expect(res.status).toBe(201);
            }

            const res = await registerUser(expressApp, testUser);
            expect(res.status).toBe(429);
            expect(res.body.msg).toBe(RATE_LIMIT_CONFIG.ERROR_MESSAGE);
        });

        it("Should reset after the rate limit window expires", async () => {
            for (let i = 0; i < RATE_LIMIT_CONFIG.MAX_REQUESTS; i++) {
                const res = await registerUser(
                    expressApp, {
                    username: `Username${i}`,
                    password: "123Username",
                    email: `testemail${i}@testmail.com`,
                });
                expect(res.status).toBe(201);
            }

            await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_CONFIG.WINDOW_MS));

            const res = await registerUser(expressApp, {
                username: "NewUser",
                password: "TestPassword1",
                email: "newuser@example.com",
            });
            expect(res.status).toBe(201);
        });

        it("Should limit requests per client IP", async () => {
            for (let i = 0; i < RATE_LIMIT_CONFIG.MAX_REQUESTS; i++) {
                const res = await request(expressApp)
                    .post("/auth/register")
                    .set("X-Forwarded-For", "192.168.1.1")
                    .send({
                        username: `User${i}`,
                        password: "TestPassword1",
                        email: `user${i}@example.com`,
                    });
                expect(res.status).toBe(201);
            }

            const resFromAnotherClient = await request(expressApp)
                .post("/auth/register")
                .set("X-Forwarded-For", "192.168.1.2")
                .send({
                    username: "NewUser",
                    password: "TestPassword1",
                    email: "newuser@example.com",
                });
            expect(resFromAnotherClient.status).toBe(201);
        });


        it("Should handle concurrent requests within the limit", async () => {
            const promises = [];
            for (let i = 0; i < RATE_LIMIT_CONFIG.MAX_REQUESTS; i++) {
                promises.push(
                    await registerUser(expressApp, {
                        username: `User${i}`,
                        password: "TestPassword1",
                        email: `user${i}@example.com`,
                    })
                );
            };

            const responses = await Promise.all(promises);

            responses.forEach((res) => {
                expect(res.status).toBe(201);
            });

        });

        it("Should allow up to the limit and reject exceeding requests in a single loop", async () => {
            const exceedingLimit = 5;
            const results = await Promise.all(
                Array.from({ length: RATE_LIMIT_CONFIG.MAX_REQUESTS + exceedingLimit }).map((_, i) =>
                    registerUser(expressApp, {
                        username: `User${i}`,
                        password: "TestPassword1",
                        email: `user${i}@example.com`,
                    })
                        .then((res) => ({
                            status: res.status,
                            body: res.body,
                        }))
                )
            );

            const successfulRequests = results.filter((res) => res.status === 201).length;
            const failedRequests = results.filter((res) => res.status === 429).length;

            expect(successfulRequests).toBe(RATE_LIMIT_CONFIG.MAX_REQUESTS);
            expect(failedRequests).toBe(exceedingLimit);
        });
    });

    describe("Input Validation", () => {
        it("Shouldn't allow special characters in username", async () => {
            const response = await registerUser(
                expressApp, {
                username: "user!@#",
                password: "@test#uSer!on%1",
                email: "valid.email@example.com",
            });

            expect(response.status).toBe(400);
            expect(response.body.errors[0].msg).toBe(
                "Username must contain only letters and numbers"
            );
        });
    });
});

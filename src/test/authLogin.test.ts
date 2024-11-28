import request, { Response } from "supertest";
import { createApp } from "../app";
import { AppDataSource } from "../data-source";
import { Express } from "express";
import jwt from "jsonwebtoken";
import { rateLimiterManager } from "../middlewares/rateLimiterManager";
import { RATE_LIMIT_CONFIG } from "../config/constants";
import { advanceBy, clear } from "jest-date-mock";
import {
    logUser,
    registerUser,
    extractTokenFromCookie,
    dataDestroy,
    cleanData,
    testUser
} from "./utility/utility";

describe("auth/login", () => {
    let expressApp: Express;
    let dataSource: typeof AppDataSource;

    beforeAll(async () => {
        const appWithDataSource = createApp();
        expressApp = appWithDataSource.app;
        dataSource = appWithDataSource.dataSource;

        await dataSource.initialize();
    });

    afterAll(async () => {
        await dataDestroy(dataSource);
        clear();
    });

    afterEach(async () => {
        await cleanData(dataSource);
    });

    beforeEach(async () => {
        await registerUser(expressApp, testUser);
        rateLimiterManager.resetAllKeys();
    });

    describe("Validation Tests", () => {
        describe("username", () => {
            it("Should login successfully", async () => {
                const response = await logUser(expressApp, testUser);
                expect(response.status).toBe(200);
            });

            it("Should fail logging because the username is undefined", async () => {
                const response = await logUser(expressApp, { ...testUser, username: undefined });
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

            it("Should ignore unexpected fields in login payload", async () => {
                const response = await logUser(expressApp, { ...testUser, unexpectedField: "ignored" } as any);
                expect(response.status).toBe(200);
            });

            it("Should fail logging because the username is empty string", async () => {
                const response = await logUser(expressApp, { ...testUser, username: "" });
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
                const response = await logUser(expressApp, { ...testUser, username: "1 woork h4@rd" });
                expect(response.status).toBe(400);
                expect(response.body.errors).toContainEqual(
                    expect.objectContaining({
                        msg: "Invalid credentials",
                        path: "username",
                    })
                );
            });

            it("Should fail logging because the username is long", async () => {
                const response = await logUser(expressApp, { ...testUser, username: "a".repeat(256) });
                expect(response.status).toBe(400);
                expect(response.body.errors).toContainEqual(
                    expect.objectContaining({
                        msg: "Invalid credentials",
                        path: "username",
                    })
                );
            });

            it("Should fail logging because the username doesn't exist", async () => {
                const response = await logUser(expressApp, { ...testUser, username: "noNex1stent" });
                expect(response.status).toBe(404);
                expect(response.notFound).toBe(true);
            });

            it("Should login because case insensitive", async () => {
                const response = await logUser(expressApp, { ...testUser, username: "TESTUSER" });
                expect(response.status).toBe(200);
            });
        });

        describe("password", () => {
            it("Should fail when password is less than 8 characters", async () => {
                const response = await logUser(expressApp, { ...testUser, password: "User1" });
                expect(response.status).toBe(400);
                expect(response.body.errors).toContainEqual(
                    expect.objectContaining({
                        msg: "Invalid credentials",
                        path: "password",
                    })
                );
            });

            it("Should fail when password is nonexistent", async () => {
                const response = await logUser(expressApp, { ...testUser, password: undefined });
                expect(response.status).toBe(400);
                expect(response.body.errors).toContainEqual(
                    expect.objectContaining({
                        msg: "Password is required",
                        path: "password",
                    })
                );
            });

            it("Should fail when password is without an uppercase letter", async () => {
                const response = await logUser(expressApp, { ...testUser, password: "testuser" });
                expect(response.status).toBe(400);
                expect(response.body.errors).toContainEqual(
                    expect.objectContaining({
                        msg: "Invalid credentials",
                        path: "password",
                    })
                );
            });

            it("Should fail when password is without a single digit", async () => {
                const response = await logUser(expressApp, { ...testUser, password: "Testuser" });
                expect(response.status).toBe(400);
                expect(response.body.errors).toContainEqual(
                    expect.objectContaining({
                        msg: "Invalid credentials",
                        path: "password",
                    })
                );
            });

            it("Should be Unauthorized when password is wrong", async () => {
                const response = await logUser(expressApp, { ...testUser, password: "Wr0ngp@ss" });
                expect(response.status).toBe(401);
                expect(response.unauthorized).toBe(true);
            });
        });
    });

    describe("Token and Cookie Tests", () => {

        it("Should reject malformed token", async () => {
            const loginResponse = await logUser(expressApp, testUser);
            const cookiesHeader = loginResponse.headers["set-cookie"];
            const tokenValue = extractTokenFromCookie(cookiesHeader);
            expect(tokenValue).toBeDefined();

            const malformedToken = tokenValue!.slice(0, -5) + "12345";
            const response = await request(expressApp)
                .get("/user/me")
                .set("Cookie", [`token=${malformedToken}`]);

            expect(response.status).toBe(401);
            expect(response.body).toEqual(
                expect.objectContaining({
                    msg: "Invalid token",
                })
            );
        });

        it("Should reject a token with tampered audience (aud)", async () => {
        
            const loginResponse = await logUser(expressApp, testUser);
            const cookieHeader = loginResponse.headers["set-cookie"];
            const tokenValue = extractTokenFromCookie(cookieHeader);
            expect(tokenValue).toBeDefined();
        
            const decodedToken = jwt.decode(tokenValue!, { complete: true }) as { header: any; payload: any };
            expect(decodedToken).toBeDefined();
        
            decodedToken.payload.aud = "tampered_app";
        
            const tamperedToken = [
                Buffer.from(JSON.stringify(decodedToken.header)).toString("base64"),
                Buffer.from(JSON.stringify(decodedToken.payload)).toString("base64"),
                "tampered_signature"
            ].join(".");
        
            const tamperedCookie = `token=${tamperedToken}; Path=/; HttpOnly; SameSite=Strict`;
        
            const response = await request(expressApp)
                .get("/user/me")
                .set("Cookie", [tamperedCookie]);
        
            expect(response.status).toBe(401);
            expect(response.body.msg).toBe("Invalid token");
        });

        it("Should reject expired tokens", async () => {
            const response = await logUser(expressApp, testUser);
            const cookiesHeader = response.headers["set-cookie"];
            const tokenValue = extractTokenFromCookie(cookiesHeader);

            const decodedToken = jwt.decode(tokenValue!, { complete: true }) as {
                payload: { exp: number };
            };
            const currentTime = Math.floor(Date.now() / 1000);
            expect(decodedToken.payload.exp).toBeGreaterThan(currentTime);

            const timeToAdvance = (decodedToken.payload.exp - currentTime + 1) * 1000;
            advanceBy(timeToAdvance);

            expect(() => jwt.verify(tokenValue!, process.env.SECRET_KEY!)).toThrow("jwt expired");
        });

        it("Should reject a token with missing claims", async () => {
            const invalidToken = jwt.sign({}, process.env.SECRET_KEY!, {
                expiresIn: "1h",
                algorithm: "HS512",
            });
    
            const response = await request(expressApp)
                .get("/user/me")
                .set("Cookie", [`token=${invalidToken}`]);
    
            expect(response.status).toBe(401);
            expect(response.body.msg).toBe("Invalid token");
        });

        
        it("Should set the token in a cookie with the right attributes on successful login", async () => {
            const response = await logUser(expressApp, testUser);
            const cookiesHeader = response.headers["set-cookie"];
            const cookies = Array.isArray(cookiesHeader) ? cookiesHeader : [cookiesHeader].filter(Boolean);
            expect(Array.isArray(cookies)).toBe(true);

            const tokenCookie = cookies.find((cookie: string) => cookie.startsWith("token="));
            expect(tokenCookie).toBeDefined();
            expect(tokenCookie).toMatch(/HttpOnly/);
            expect(tokenCookie).toMatch(/SameSite=Strict/);

            const tokenValue = tokenCookie?.split(";")[0]?.split("=")[1];
            expect(tokenValue).toBeDefined();

            const decodedToken = jwt.verify(tokenValue!, process.env.SECRET_KEY!);
            expect(decodedToken).toEqual(
                expect.objectContaining({
                    id: 1,
                    username: testUser.username,
                })
            );
        });
    });

    describe("Edge Cases and Security", () => {

        it("Should fail after too many requests in a short period", async () => {
            for (let i = 0; i < RATE_LIMIT_CONFIG.MAX_REQUESTS; i++) {
                const res = await logUser(expressApp, { ...testUser, username: `testUser${i}` });
                expect(res.status).toBe(404);
            }

            const res = await logUser(expressApp, testUser);
            expect(res.status).toBe(429);
            expect(res.body.msg).toBe(RATE_LIMIT_CONFIG.ERROR_MESSAGE);
        });

        it("Should reject excessively large payloads", async () => {
            const largePayload = { ...testUser, username: "a".repeat(1000000) };
            const response = await logUser(expressApp, largePayload);
            expect(response.status).toBe(413);
        });
    });
});

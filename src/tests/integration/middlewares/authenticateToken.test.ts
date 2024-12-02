import request from "supertest";
import { AppDataSource } from "../../../data-source";
import { Express } from "express"
import { rateLimiterManager } from "../../../middlewares";
import TestApp from "../../utility/testApp";
import jwt from "jsonwebtoken";

describe("Authenicate Token", () => {
    let expressApp: Express;
    let dataSource: typeof AppDataSource;

    beforeAll(async () => {
        const appWithData = await TestApp.getInstance();
        TestApp.cleanData();
        expressApp = appWithData.app;
        dataSource = appWithData.dataSource;
    })

    afterAll(async () => {
        await TestApp.cleanup();
    })

    afterEach(async () => {
        await TestApp.cleanData();
    })

    beforeEach(async () => {
        rateLimiterManager.resetAllKeys();
    })

    it("should return 401 for missing token", async () => {
        const res = await request(expressApp)
            .get("/user/me");

        expect(res.status).toBe(401);
    })

    it("Should return 200 ok for valid token in the header", async () => {

        const validToken = jwt.sign(
            { id: 1, username: "testuser" },
            process.env.SECRET_KEY!,
            { audience: process.env.AUD, issuer: process.env.ISS }
        )

        const res = await request(expressApp)
            .get("/user/me")
            .set("Authorization", `Bearer ${validToken}`);

        expect(res.status).toBe(200);

        expect(res.body).toEqual(
            expect.objectContaining({
                id: 1,
                username: "testuser",
            })
        );
    })

    it("Should return 401 for invalid token", async () => {
        const res = await request(expressApp)
            .get("/user/me")
            .set("Authorization", `Bearer invalidtoken`)

        expect(res.status).toBe(401);
        console.log(res.body);
        expect(res.body.message).toBe("Invalid token");
    })

    it("Should return 401 for expired token", async () => {
        const expiredToken = jwt.sign(
            { id: 1, username: "username" },
            process.env.SECRET_KEY!, {
            audience: process.env.AUD,
            issuer: process.env.ISS,
            expiresIn: "-1s"
        }
        )

        const res = await request(expressApp)
            .get("/user/me")
            .set("Authorization", `Bearer ${expiredToken}`);

        expect(res.status).toBe(401);
        expect(res.body.message).toBe("Token expired");
    });

    it("Should decode token with extra claims", async () => {
        const token = jwt.sign({
            id: 1,
            username: "username",
            role: "god",
            extra: "extradata[]234"
        },
            process.env.SECRET_KEY!, {
            audience: process.env.AUD,
            issuer: process.env.ISS,
        }
        )

        const res = await request(expressApp)
            .get("/user/me")
            .set("Authorization", `Bearer ${token}`)

        expect(res.status).toBe(200);
        expect(res.body.username).toBe("username");
    })

    it("Should return 401 of malformed token", async () => {
        const res = await request(expressApp)
            .get("/user/me")
            .set("Authorization", "Malformed, disformed")

        expect(res.status).toBe(401);
        expect(res.body.message).toBe("Invalid token");
    })

    it("Should return 401 for token signed with wrong algorithm", async () => {

        const token = jwt.sign(
            { id: 1, username: "username"},
            process.env.SECRET_KEY!, { 
                algorithm: "HS512", 
                audience: process.env.AUD, 
                issuer: process.env.ISS 
            }
        )

        const res = await request(expressApp)
            .get("/user/me")
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(401);
        expect(res.body.message).toBe("Invalid token");
    })

    it("should return 401 because of missing required claims", async () => {
        const token = jwt.sign(
            { id: 1, username: "username" },
            process.env.SECRET_KEY!,
            {}
        )

        const res = await request(expressApp)
            .get("/user/me")
            .set("Authorization", `Bearer token`)

        expect(res.status).toBe(401);
        expect(res.body.message).toBe("Invalid token");
    })

    it("Should prioritize Authorization token over cookie token", async () => {
        const authToken = jwt.sign({
            id: 1, username: "username"
        }, process.env.SECRET_KEY!, {
            audience: process.env.AUD,
            issuer: process.env.ISS
        })

        const cookieToken = jwt.sign({
            id: 2, username: "username2"
        }, process.env.SECRET_KEY!, {
            audience: process.env.AUD,
            issuer: process.env.ISS
        })

        const res = await request(expressApp)
            .get("/user/me")
            .set("Authorization", `Bearer ${authToken}`)
            .set("Cookie",`token=${cookieToken}`);

        expect(res.status).toBe(200);
    })
})
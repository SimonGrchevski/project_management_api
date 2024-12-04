import express, {Express, Request, Response, NextFunction } from 'express';
import { rateLimiterManager } from "../../../middlewares";
import {RATE_LIMIT_CONFIG} from "../../../config/constants";
import request from "supertest";
import TestApp from "../../utility/testApp";
import { clear, advanceBy } from "jest-date-mock";

describe("RateLimiter", () => {
    let expressApp: Express;
    
    beforeAll(async () => {
        const appWithData = await TestApp.getInstance();
        await TestApp.cleanData();
        
        expressApp = appWithData.app;

        expressApp.use(express.json());
        expressApp.use(rateLimiterManager.middleware);

        expressApp.get("/test/limit", (__: Request, res: Response, _: NextFunction) => {
            res.status(200).send({
                msg: "Success",
            })
        })
    });
    
    afterEach(async () => {
        rateLimiterManager.resetAllKeys();
        clear();
    })

    afterAll(async () => {
        await TestApp.cleanup();
    })

    
    it("Should allow requests under the limit", async () => {
        for(let i = 0; i < RATE_LIMIT_CONFIG.MAX_REQUESTS; i++ ) {
            const res = await request(expressApp).get("/test/limit");
            expect(res.status).toBe(200);
            expect(res.body.msg).toBe("Success");
        }
    })
    
    it("Should block requests exceeding the set limit", async () => {
        for(let i = 0; i < RATE_LIMIT_CONFIG.MAX_REQUESTS; i++) {
            const res = await request(expressApp).get("/test/limit");
            expect(res.status).toBe(200);
            expect(res.body.msg).toBe("Success");
        }
        
        const res = await request(expressApp).get("/test/limit");
        expect(res.status).toBe(429);
        expect(res.body.msg).toBe(RATE_LIMIT_CONFIG.ERROR_MESSAGE);
    });
    
    it("Should allow requests after resetting the keys", async () => {
        for(let i = 0; i < RATE_LIMIT_CONFIG.MAX_REQUESTS; i++) {
            await request(expressApp).get("/test/limit");
        }
        
        const blockedRes = await request(expressApp).get("/test/limit");
        expect(blockedRes.status).toBe(429);
        
        rateLimiterManager.resetAllKeys();

        const res = await request(expressApp).get("/test/limit");
        expect(res.status).toBe(200);
        expect(res.body.msg).toBe("Success");
    })
    
    it("Should use x-forwarded-for header for rate limiting", async() => {
        const headers = {"x-forwarded-for": "192.168.0.1" };
        
        for(let i = 0; i < RATE_LIMIT_CONFIG.MAX_REQUESTS; i++) {
            await request(expressApp)
                .get("/test/limit")
                .set(headers);
        }
        
        const res = await request(expressApp)
            .get("/test/limit")
            .set(headers);
        
        expect(res.status).toBe(429);
        expect(res.body.msg).toBe(RATE_LIMIT_CONFIG.ERROR_MESSAGE);
    })
    
    it("Should treat different ips  as separate clients", async () => {
        const ip1 = {"x-forwarded-for":"192.168.0.1"};
        const ip2 = {"x-forwarded-for": "192.168.0.2"};
        
        for(let i = 0; i < RATE_LIMIT_CONFIG.MAX_REQUESTS; i++) {
            const ip1Res= await request(expressApp)
                .get("/test/limit")
                .set(ip1);
            expect(ip1Res.status).toBe(200);
            expect(ip1Res.body.msg).toBe("Success");
        }
        
        const ip2Res = await request(expressApp)
            .get("/test/limit")
            .set(ip2);
        expect(ip2Res.status).toBe(200);
        expect(ip2Res.body.msg).toBe("Success");
    })
    
    it("Should should allow requests after the rate limit window has elapsed", async () => {
        for(let i = 0; i < RATE_LIMIT_CONFIG.MAX_REQUESTS; i++) {
            await request(expressApp)
                .get("/test/limit");
        }
        
        const blockedRes = await request(expressApp)
            .get("/test/limit")
            
        expect(blockedRes.status).toBe(429);
        
        advanceBy(RATE_LIMIT_CONFIG.WINDOW_MS);
        
        const allowedRes = await request(expressApp)
            .get("/test/limit");
        
        expect(allowedRes.status).toBe(200);
        expect(allowedRes.body.msg).toBe("Success");
    })
    
})
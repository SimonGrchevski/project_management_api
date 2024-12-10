import request from 'supertest';
import { Express, Request, Response } from 'express';
import TestApp from "../../utility/testApp";
import {AppDataSource} from "../../../data-source";
import {Repository} from "typeorm";
import {User} from "../../../entities";
import {testUser} from "../../utility/utility";
import {rateLimiterManager} from "../../../middlewares";
import jwt from "jsonwebtoken";
import {advanceBy} from "jest-date-mock";

describe('Integration | Auth - Delete', () => {
    
    let expressApp: Express;
    let dataSource: typeof AppDataSource;
    let userRepo:Repository<User>
    let newUser: User;
    let token: string;
    let savedUser: User;
    
    beforeAll(async() => {
        const appWithData = await TestApp.getInstance();
        await TestApp.cleanData();
        
        expressApp = appWithData.app;
        dataSource = appWithData.dataSource;
        userRepo = dataSource.getRepository(User);
        
        const newUser = userRepo.create(testUser);
        const savedUser = await userRepo.save(newUser);
        
        token = jwt.sign(
            {
                id: savedUser.id,
                username: savedUser.username,
                aud: process.env.AUD,
                iss: process.env.ISS,
            },
            process.env.SECRET_KEY!,
            { expiresIn: "1h", algorithm: 'HS512' }
        );
        
    });
    
    afterAll(async() => {
        await TestApp.cleanup();
    })
    
    afterEach(async() => {
        await TestApp.cleanData();
        rateLimiterManager.resetAllKeys();
    })
    
    it("Should delete a user successfully with valid token and id", async () => {
        const res = await request(expressApp)
            .delete("/auth/delete")
            .set("Cookie", [`token=${token}`])
            .send({id:1});
        
        expect(res.status).toBe(200);
        expect(res.body.msg).toBe("User deleted successfully");
        
        const deleted = await userRepo.findOneBy({username:testUser.username})
    })
    
    it("Should return 403 if the token and the id doesnt match", async () => {
        const res = await request(expressApp)
            .delete("/auth/delete")
            .set("Cookie", [`token=${token}`])
            .send({id:666});
        
        expect(res.status).toBe(403);
        expect(res.body.message).toBe("You not authorized to update this user.");
    })
    
    it("Should return 401 if no token is provided", async () => {
        const res = await request(expressApp)
            .delete("/auth/delete")
            .send({id:666});
        
        expect(res.status).toBe(401);
        expect(res.body.message).toBe("No token provided");
    })
    
    it("Should return 403 if user tries to delete another user's account", async () => {
        const user = userRepo.create({
                username: "anotheruser",
                password: "@noTherUser5Acc",
                email: "@noTherUs3r5Acc"
            } as Partial<User>
        );
        const savedUser = await userRepo.save(user);
        
        const res = await request(expressApp)
            .delete("/auth/delete")
            .set("Cookie", [`token=${token}`])
            .send({id: 5});
        
        expect(res.status).toBe(403);
        expect(res.body.message).toBe("You not authorized to update this user.");
    })
    
    it("Should return 403 because of malformed id" , async() => {
        const res = await request(expressApp)
            .delete("/auth/delete")
            .set("Cookie", [`token=${token}`])
            .send({id:"this is my id"});
        
        expect(res.status).toBe(403);
        expect(res.body.message).toBe("Id is missing");
    })
    
    it("Should return 403 if the id is missing", async () => {
        const res = await request(expressApp)
            .delete("/auth/delete")
            .set("Cookie", [`token=${token}`])
            .send({});
        
        expect(res.status).toBe(403);
        expect(res.body.message).toBe("Id is missing");
    })
    
    it("Should return 401 for a expired token", async () => {
        token = jwt.sign(
            {
                id: 1,
                username: testUser,
                aud: process.env.AUD,
                iss: process.env.ISS,
            },
            process.env.SECRET_KEY!,
            { expiresIn: "1h", algorithm: 'HS512' }
        );
        const decodedToken = jwt.decode(token!, { complete: true }) as {
            payload: { exp: number };
        };
        const currentTime = Math.floor(Date.now() / 1000);
        expect(decodedToken.payload.exp).toBeGreaterThan(currentTime);

        const timeToAdvance = (decodedToken.payload.exp - currentTime + 1) * 1000;
        advanceBy(timeToAdvance);
        
        const res = await request(expressApp)
            .delete("/auth/delete")
            .set("Cookie", [`token=${token}`])
            .send({id:1});
        
        expect(res.status).toBe(401);
        expect(res.body.message).toBe("Token expired");
    })
    
})
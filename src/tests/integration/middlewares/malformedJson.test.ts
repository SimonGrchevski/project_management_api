import express, {Express, NextFunction, Request, Response} from 'express';
import TestApp from "../../utility/testApp";
import request from 'supertest';
import {ErrorFactory} from "../../../utility/errorFactory";
import { jest } from "@jest/globals";
import {malformedJson} from "../../../middlewares";

jest.mock("../../../utility/errorFactory", () => ({
    ErrorFactory: {
        badRequest: jest.fn().mockImplementation((details, message) => ({
            statusCode: 400,
            message,
            details,
        })),
    },
}));




describe('Integration | malformedJson', () => {
    let expressApp: Express;
    
    beforeEach(async () => {
        const app = await TestApp.getInstance();
        expressApp = app.app;
        
        expressApp.use(express.json());
        
        expressApp.use(malformedJson);

        expressApp.post("/error", async (req: Request, res: Response) => {
            res.status(200).send({
                msg:"Valid JSON payload!"
            })
        })


        expressApp.use((err:any,req:Request,res:Response,next:NextFunction) => {
            const {statusCode, message, details} = err;
            res.status(statusCode || 500)
                .send({
                    status: "error",
                    message,
                    errors:details,
                })
        } )
    })
    
    afterAll(async () => {
        await TestApp.cleanup(); // shouldn't need, however...
    })
    
    it("Should return 400 for malformed json", async () => {
        const res  = await request(expressApp)
            .post("/error")
            .set("Content-Type", "application/json")
            .send(`{"invalidJson":"missingSomething`);
        
        expect(res.status).toBe(400);
    })
    
    it("Should pass valid json", async() => {
        const res = await request(expressApp)
            .post("/error")
            .set("Content-Type", "application/json")
            .send(`{"invalidJson":"missingSomething"}`);
        
        expect(res.status).toBe(200);
        expect(res.body).toEqual({msg:"Valid JSON payload!"})
    })
    
    it("Should handle non JSON as well", async () => {
        const res = await request(expressApp)
            .post("/error")
            .set("Content-Type", "application/x-www-form-urlencoded")
            .send(`key=value`);
        
        expect(res.status).toBe(200);
        expect(res.body).toEqual({msg:"Valid JSON payload!"});
    })
    
    it("Should return 400 if the malformed json is deeply nested", async () => {
        const res = await request(expressApp)
            .post("/error")
            .set("Content-Type", "application/json")
            .send(`{"invalidJson": {"nested": true"} }`);

        expect(res.status).toBe(400);
        expect(res.body).toEqual({
            errors:[],
            message: "Invalid JSON payload",
            status: "error"
        });
    })
    
    
})
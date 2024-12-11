import TestApp from "../../utility/testApp";
import { Request, Response, NextFunction, Express } from "express";
import request from "supertest";
import {inputNormalizer} from "../../../middlewares";

const createTestRoute = (app: Express, validatation: string[] )=>
{
    app.use(
        "/normalize",
        inputNormalizer(validatation),
        (req:Request, res: Response, _:NextFunction) => {
            res.status(200).json({body: req.body});
        })
}

describe("Integration | InputNormalizer", () => {
    let expressApp: Express;

    beforeAll(async() => {
        const appWithData = await TestApp.getInstance();
        expressApp = appWithData.app;

        createTestRoute(expressApp,["username", "email"]);
    });
    
    
    it("Should trim the input", async() => {
        const payload = {
            username: "     USErname ",
            email: "EMAIL@EMAIL.CoM    "
        };
        
        const res = await request(expressApp)
            .get("/normalize")
            .send(payload);
        
        expect(res.status).toBe(200);
    });
    
    it("Should ignore non string fields", async() => {
        createTestRoute(expressApp,["username", "id"]);
        const payload = {
            username: "  USErname ",
            id: 3
        };
        
        const res = await request(expressApp)
            .get("/normalize")
            .send(payload);
        expect(res.status).toBe(200);
        expect(res.body.body).toMatchObject({
            username:"username",
            id:3
        });
    });
    
    it("Should not modify fields that are not in the validation array", async() => {
        createTestRoute(expressApp,["username"]);
        const payload = {
            username: "     USErname ",
            location: "Munich Germany"
        };
        
        const res = await request(expressApp)
            .get("/normalize")
            .send(payload);
        
        expect(res.status).toBe(200);
        expect(res.body.body).toMatchObject({...payload, username: "username"});
    });
    
    it("Should handle empty or missing fields", async() => {
        createTestRoute(expressApp,["username"]);

        const res = await request(expressApp)
            .get("/normalize")
            .send({});

        expect(res.status).toBe(200);
    });
    
    it("Should handle only save strings", async() =>{
        createTestRoute(expressApp,["username","email"]);
        const payload = {
            username: " ",
            email: "            "
        }
        
        const res = await request(expressApp)
            .get("/normalize")
            .send(payload);
        
        expect(res.status).toBe(200);
        expect(res.body.body).toMatchObject(payload);
    })
})

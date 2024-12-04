import express, { Request, Response, NextFunction } from 'express';
import {body} from 'express-validator';
import request from 'supertest';
import {validateRequest} from "../../../middlewares";
import { validationResult } from "express-validator";
import { jest } from "@jest/globals";

describe('/integration/middlewares/validateRequest', () => {

    const app = express();
    app.use(express.json());
    
    app.post(
        "/test/validate",
        [
            body("username")
                .notEmpty().withMessage("Username is required"),
            body("email")
                .isEmail().withMessage("Email is required")
                .notEmpty().withMessage("Invalid email"),
        ],
        async(req: Request, res: Response, next: NextFunction) => {
            validateRequest(req, res,next);
        },
        (req: Request, res: Response, next: NextFunction) => {
            res.status(200).json({msg:"Validation passed"});
        })


    beforeAll(async() => {
        jest.clearAllMocks();
    })
    
    it("Should pass for valid inpit", async() => {
        const res = await request(app)
            .post("/test/validate")
            .send({
                username: "username",
                email: "email@email.com",
            })

        expect(res.status).toBe(200);
        expect(res.body.msg).toBe("Validation passed");
    })
    
    it("Should return 400 because of missing username",async () => {
        const res = await request(app)
            .post("/test/validate")
            .send({
                email: "email@email.com"
            })
        
        expect(res.status).toBe(400);
    })
    
    it("Should return 400 for missing email",async () => {
        const res = await request(app)
            .post("/test/validate")
            .send({email:"email@email.com"})
        
        expect(res.status).toBe(400);
    })
    
    
    it("Should return 400 for email is in wrong format",async () => {
        const res = await request(app)
            .post("/test/validate")
            .send({email:"emailemail.com", username: "username"})
        
        expect(res.status).toBe(400);
    });
});
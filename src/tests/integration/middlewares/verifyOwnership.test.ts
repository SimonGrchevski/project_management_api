import express, { Request, Response, NextFunction } from 'express';
import request from 'supertest';
import {verifyOwnership} from "../../../middlewares";
import { CustomError } from "../../../types/customError";

const app = express();
app.use(express.json());

app.get("/test/verifyOwnership",
    verifyOwnership,
    (req: Request, res: Response) => {
        res.status(200).json({msg:"Ownership verified"});
})

app.use((err:(CustomError),req:Request, res:any,next:NextFunction) => {
    res.status(err.statusCode || 500).json({
        msg:err.message,
        errors: err.details || undefined
    });
})

describe('Verify Ownership Integration Tests', () => {
    
    it("Should return 403 when the id is missing", async () => {
        const res = await request(app)
            .get("/test/verifyOwnership")
            .send({})

        expect(res.status).toBe(403);
        expect(res.body).toEqual({
            msg: "Forbiden",
            errors: "Id is missing"
        });
    })
    
    it("Should return 401 when the token is missing", async () => {
        const res = await request(app)
            .get("/test/verifyOwnership")
            .send({id:2})
        
        expect(res.status).toBe(401);
        expect(res.body).toEqual({
            msg: "Unauthorized",
            errors: "Token is invalid or missing"
        });
    })
    
})
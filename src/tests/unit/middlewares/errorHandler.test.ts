import { Request, Response, NextFunction} from "express";
import { errorHandler } from "../../../middlewares";
import { CustomError } from "../../../types/customError";
import { jest } from "@jest/globals";


describe("Error Handler", () => {

    let req: Partial<Request>
    let res: Partial<Response>
    let next: jest.Mock

    beforeEach(()=> {
       
        req = {}
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        } as unknown as Response
        next= jest.fn()      
    })

    it("Should handle custom error with specific status and message", () => {
        let customError = {
            statusCode:400,
            message:"Bad request",
            details: [{msg:"Invalid input"}]
        } as CustomError

        errorHandler(customError,req as Request,res as Response, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            status:"error",
            message: "Bad request",
            errors:[{msg:"Invalid input"}]
        })
    })

    it("Should handle custom error gracefully", () => {

        const unexpectedError = new Error("Internal Server Error");

        errorHandler(unexpectedError, req as Request, res as Response, next);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            status: "error",
            message: "Internal Server Error",
        })
    })

    it("Should handle custom error without details", () => {

        const err = {
            statusCode:403,
            message:"Forbidden Access"
        }

        errorHandler(err as CustomError, req as Request, res as Response, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({
            status: "error",
            message: "Forbidden Access",
        })
    })

    it("Should handle too many requests", () => {

        const err = {
            statusCode:429,
            message:"Too many requests"
        }

        errorHandler(err as CustomError, req as Request, res as Response, next);

        expect(res.status).toHaveBeenCalledWith(429);
        expect(res.json).toHaveBeenCalledWith({
            status:"error",
            message:"Too many requests"
        });
    })
})
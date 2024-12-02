import express, { Request, Response, NextFunction, Express } from "express";
import TestApp from "../../utility/testApp";
import { errorHandler } from "../../../middlewares";
import { CustomError } from "../../../types/customError";
import { AppDataSource } from "../../../data-source";
import { rateLimiterManager } from "../../../middlewares/rateLimiterManager";
import  request  from "supertest";

describe("ErrorHandler", () => {

    let expressApp: Express;
    let appData: typeof AppDataSource;

    beforeAll(async() => {
        const appWithData = await TestApp.getInstance();
        TestApp.cleanData();
        expressApp = appWithData.app;
        appData = appWithData.dataSource;

        expressApp.use(express.json());

        rateLimiterManager.resetAllKeys();

        expressApp.get("/error", async (req: Request, res: Response, next: NextFunction) => {
            const err = {
                statusCode: 400,
                message: "Custom error",
                details:[{msg:"Invalid input", field:"username"}]
            };
            next(err);
        })


        expressApp.get("/unexpected", async (req: Request, res: Response, next: NextFunction) => {
            next(new Error("Something backfired"));
        })

        expressApp.use(errorHandler);
    })


    it("Should handle a custom error and return correct response", async() => {

        const res = await request(expressApp).get("/error");
        expect(res.status).toBe(400);
        expect(res.body).toEqual({
            status: "error",
            message: "Custom error",
            errors: [{ msg: "Invalid input", field: "username" }],
        });
    })


    it("Should handle non-custom error and return generic 500 response", async() => {
        const res = await request(expressApp).get("/unexpected");

        expect(res.status).toBe(500);
        expect(res.body).toEqual({
            status: "error",
            message: "Something backfired",
            errors: undefined,
        });
    }); 

   it("Should handle custom error without details", async () => {
        expressApp.get("/error-without-details", (req: Request, res: Response, next: NextFunction)=> {
            const err :CustomError = new CustomError(
                401,{
                    message: "Unauthorized access",
                    details: undefined
                }, 
            )
            next(err);
        })

        const res = await request(expressApp)
            .get("/error-without-details")
        
        expect(res.status).toBe(401);
   })

    it("Should validate the structure of the error message", async () => {
        const res = await request(expressApp).get("/error");

        expect(res.body).toEqual(
            expect.objectContaining({
                status: "error",
                message: expect.any(String),
                errors: expect.any(Array),
            })
        );
    })
})
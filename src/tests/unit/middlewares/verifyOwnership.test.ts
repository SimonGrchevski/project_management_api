import { Request, Response } from "express";
import { jest } from "@jest/globals";
import { verifyOwnership } from "../../../middlewares";
import { ErrorFactory } from "../../../utility/errorFactory";


jest.mock("../../../utility/errorFactory", () => ({
    ErrorFactory: {
        forbiden: jest.fn(),
        unauthorized: jest.fn()
    }
}))

describe("Unit | verifyOwnership", () => {

    let req:Partial<Request>
    let res:Partial<Response>
    let next: jest.Mock

    beforeEach( ()=> {
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        } as unknown as Response
        
        next = jest.fn();
    })
    
    afterEach(()=> {
        jest.clearAllMocks();
    })

    it("Should error with forbiden", async () => {
        req = {
            body:{}
        }

        await verifyOwnership(req as Request, res as Response, next);

        expect(ErrorFactory.forbiden).toHaveBeenCalled();
        expect(ErrorFactory.forbiden).toHaveBeenCalledWith(
            "Id is missing"
        );
    })

    it("Should error with unauthorized", async () => {
        req = {
            body:{id:33322211}
        }

        await verifyOwnership(req as Request, res as Response, next);

        expect(ErrorFactory.unauthorized).toHaveBeenCalled();
        expect(ErrorFactory.unauthorized).toHaveBeenCalledWith(
            "Token is invalid or missing"
        );
    })

    it("Should error with forrbiden, unable to update", async () => {
        req = {
            currentUser:{id:333111},
            body:{id:33322211}
        } as unknown as Request

        await verifyOwnership(req as Request, res as Response, next);

        expect(ErrorFactory.forbiden).toHaveBeenCalled();
        expect(ErrorFactory.forbiden).toHaveBeenCalledWith(
            "You not authorized to update this user."
        );
    })

    it("Should pass", async () => {
        req = {
            currentUser:{id:333111},
            body:{id:333111}
        } as unknown as Request

        await verifyOwnership(req as Request, res as Response, next);

        expect(next).toHaveBeenCalled();
    })

    it("Should error with forbiden,id is missing ", async () => {
        req = {
            currentUser:{id:333111},
        } as unknown as Request

        await verifyOwnership(req as Request, res as Response, next);

        expect(ErrorFactory.forbiden).toHaveBeenCalledWith("Id is missing")
    })
})
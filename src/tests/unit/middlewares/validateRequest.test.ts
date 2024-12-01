import { Request, Response } from "express";
import { validationResult } from "express-validator";
import { validateRequest } from "../../../middlewares";
import { jest } from "@jest/globals";
import { ErrorFactory } from "../../../utility/errorFactory";



jest.mock("express-validator", () => ({
    validationResult: jest.fn(),
}));

jest.mock("../../../utility/errorFactory", () => ({
    ErrorFactory: {
        badRequest: jest.fn(),
        internal: jest.fn()
    },
}));



describe("Validate request", () => {

    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: jest.Mock;


    afterEach(() => {
        jest.clearAllMocks();
    });

    beforeEach(() => {
        req = {
            body: {}
        }

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        } as Partial<Response>;
        next = jest.fn();

        (validationResult as unknown as jest.Mock).mockClear();
    });



    it("Should call next() if there are no validation errors", () => {
        (validationResult as unknown as jest.Mock).mockReturnValue({
            isEmpty: jest.fn().mockReturnValue(true),
        });

        validateRequest(req as Request, res as Response, next);

        expect(validationResult).toHaveBeenCalledWith(req);
        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
        expect(res.json).not.toHaveBeenCalled();
    });

    it("Should return 400 and error and Invalid email format", () => {
        (validationResult as unknown as jest.Mock).mockReturnValue({
            isEmpty: jest.fn().mockReturnValue(false),
            array: jest.fn().mockReturnValue([
                {msg:"Invalid email format", param:"email"}
            ])
        });

        validateRequest(req as Request, res as Response, next );
    

        expect(ErrorFactory.badRequest).toHaveBeenCalledWith(
            [{msg: "Invalid email format", param: "email"}],
            "Validation failed"
        );
    });

    it("Should return 400 and invalid name", () => {
        jest.clearAllMocks();
        (validationResult as unknown as jest.Mock).mockReturnValue({
            isEmpty: jest.fn().mockReturnValue(false),
            array: jest.fn().mockReturnValue([
                { msg: "Invalid username", param: "username" },
            ]),
        });
    
        validateRequest(req as Request, res as Response, next);
    
        console.log("ErrorFactory calls:", (ErrorFactory.badRequest as jest.Mock).mock.calls);
    
        expect(ErrorFactory.badRequest).toHaveBeenCalledWith(
            [{ msg: "Invalid username", param: "username" }], "Validation failed"
        );

    });

    it("Should handle unexpeted error thrown from the dep", () => {
        (validationResult as unknown as jest.Mock).mockImplementation(() => {
            throw new Error("Unexpected error");
        });

        validateRequest(req as Request, res as Response, next);
        expect(ErrorFactory.internal).toHaveBeenCalledWith(expect.any(Error));
    });

    it("Should handle empty request gracefuly", () => {
        req = {};
        (validationResult as unknown as jest.Mock).mockReturnValue({
            isEmpty: jest.fn().mockReturnValue(false),
            array: jest.fn().mockReturnValue([])
        });

        validateRequest(req as Request, res as Response, next);

        expect(next).toHaveBeenCalled();
    })

    it("Should handle multipple errors gracefuly", () => {

        (validationResult as unknown as jest.Mock).mockReturnValue({
            isEmpty: jest.fn().mockReturnValue(false),
            array: jest.fn().mockReturnValue([
                {msg:"Incorrect format for username", field:"username"},
                {msg:"Password too short", field:"Password"},
                {msg:"email missing", field: "email"}
            ])
        })

        validateRequest(req as Request, res as Response, next);

        expect(ErrorFactory.badRequest).toHaveBeenCalledWith(
            [
                {msg:"Incorrect format for username", field:"username"},
                {msg:"Password too short", field:"Password"},
                {msg:"email missing", field: "email"}
            ], 
            "Validation failed"
        );
    })
        

       
});


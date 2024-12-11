import {Request, Response, NextFunction} from "express";
import { jest } from "@jest/globals";
import { ErrorFactory } from "../../../utility/errorFactory";
import { malformedJson } from "../../../middlewares";

jest.mock("../../../utility/errorFactory", () => ({
    ErrorFactory: {
        badRequest: jest.fn(),
    },
}));


describe("Unit | malformedJson", () => {
    let req:Partial<Request>;
    let res:Partial<Response>;
    let next: jest.Mock;


    beforeEach(() => {
        req = {}
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        } as unknown as Response
        next = jest.fn();
    })
    
    afterEach(()=> {
        jest.clearAllMocks();
    })

    it("Should handle malformed JSON format errors", () => {

        const syntaxError = new SyntaxError("Unexpected error") as any;
        syntaxError.body = true;
        syntaxError.status = 400;

        malformedJson(syntaxError, req as Request, res as Response, next);

        expect(ErrorFactory.badRequest).toHaveBeenCalledWith([],"Invalid JSON payload");
        expect(next).toHaveBeenCalledWith(ErrorFactory.badRequest([],"Invalid JSON payload"));
    });

    it("Should handle non syntax error to next", () => {
        const generalError = new Error("General Error");

        malformedJson(generalError, req as Request, res as Response, next);

        expect(ErrorFactory.badRequest).not.toHaveBeenCalled();
        expect(next).toHaveBeenCalledWith(generalError);
    });

    it("Should pass nonbody syntax errors to next", () => {

        const synErr = new SyntaxError("Syntax Error") as any;
        synErr.status = 400;

        malformedJson(synErr, req as Request, res as Response, next);

        expect(ErrorFactory.badRequest).not.toHaveBeenCalled();
        expect(next).toHaveBeenCalledWith(synErr);
    })

    it("Should pass nonstatus syntax errors to next", () => {
        const synErr = new SyntaxError("Syntax error") as any;
        synErr.body = true;

        malformedJson(synErr, req as Request, res as Response, next);

        expect(ErrorFactory.badRequest).not.toHaveBeenCalled();
        expect(next).toHaveBeenCalledWith(synErr);
    })

    it("Should pass to next nonsyntax error with body and status", () => {
        const err = new Error("Undefined Error") as any;
        err.body = true;
        err.status = 400;

        malformedJson(err,req as Request, res as Response, next);

        expect(ErrorFactory.badRequest).not.toHaveBeenCalled();
        expect(next).toHaveBeenCalledWith(err);
    })
})
import { Request, Response } from "express";
import { inputNormalizer } from "../../../middlewares";
import { jest } from "@jest/globals";



describe("Input normalizer middleware", () => {


    let req: Partial<Request>
    let res: Partial<Response>
    let next: jest.Mock;

    beforeEach(() => {
        req = { body: {} };
        res = {};
        next = jest.fn();
    });
    
    afterEach(() => {
        jest.clearAllMocks();
    })

    it("Should trim and lowercase the input", () => {
        req.body = {
            username: "USERnamE",
            email:"     myemail@long.com  "
        };

        inputNormalizer(["username", "email"])(req as Request, res as Response, next);

        expect(req.body).toEqual({
            username: "username",
            email: "myemail@long.com",
        });
        expect(next).toHaveBeenCalled();
    })

    it("Should handle missing fields and calling it without arguments gracefully", () => {
        req.body = {}

        inputNormalizer()(req as Request, res as Response, next);

        expect(req.body).toEqual({});
        expect(next).toHaveBeenCalled();
    })

    it("Should handle missing fields gracefully", () => {
        req.body = {}

        inputNormalizer(["username", "password"])(req as Request, res as Response, next);

        expect(req.body).toEqual({});
        expect(next).toHaveBeenCalled();
    })

    it("Should handle null or empty strings", () => {
        req.body = {username: "", password:""};

        inputNormalizer(["username", "password"])(req as Request, res as Response, next);

        expect(next).toHaveBeenCalled();
    })

    it("Should ignore other types", () => {
        req.body = { 
            username: 1,
            password: false
        }

        inputNormalizer(["username","password"])(req as Request, res as Response, next);

        expect(next).toHaveBeenCalled();
        expect(req.body).toEqual({ 
            username: 1,
            password: false
        });
    })
})
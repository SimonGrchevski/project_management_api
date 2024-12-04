import { Request, Response, NextFunction } from "express";
import { jest } from "@jest/globals";
import { authenticateToken } from "../../../middlewares";
import jwt from "jsonwebtoken";
import { ErrorFactory } from "../../../utility/errorFactory";

jest.mock("jsonwebtoken", () => ({
    verify: jest.fn()
}));

jest.mock("../../../utility/errorFactory", () => ({
    ErrorFactory: {
        unauthorized: jest.fn()
    }
}));

describe("authenticateToken", () => {

    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: jest.Mock;

    const SECRET_KEY = "mockSecretKey";
    const AUD = "mockAudience";
    const ISS  = "mockIssuer";

    beforeEach(() => {
        process.env.SECRET_KEY = SECRET_KEY;
        process.env.AUD = AUD;
        process.env.ISS = ISS;

        req = { headers:{}, cookies:{} };
        res = {};
        next = jest.fn();

        jest.clearAllMocks();
    });

    it("Should handle missing token", () => {
        authenticateToken("currentUser")(req as Request, res as Response, next);

        expect(ErrorFactory.unauthorized).toHaveBeenCalledWith([],"No token provided");
        expect(next).toHaveBeenCalledWith(
            ErrorFactory.unauthorized("No token provided")
        );
    });

    it("Should decode token form Authorization header", () => {

        const decodedPayload = {id:1, username: "username"};
        (jwt.verify as jest.Mock).mockReturnValue(decodedPayload);

        req.headers!["authorization"] = "Bearer validToken";

        authenticateToken("currentUser")(req as Request, res as Response, next);

        expect(jwt.verify).toHaveBeenCalledWith(
            "validToken",
            SECRET_KEY,
            expect.anything(),
        );

        expect(next).toHaveBeenCalled();
    });

    it("should decode token from cookies", () => {
        const decodedPayload = {id:1, username: "username"};
        (jwt.verify as jest.Mock).mockReturnValue(decodedPayload);

        req.cookies = {token: "validToken"};
        authenticateToken("currentUser")(req as Request, res as Response, next);

        expect(jwt.verify).toHaveBeenCalledWith(
            "validToken",
            SECRET_KEY,
            expect.anything(),
        )

        expect(next).toHaveBeenCalled();
    });

    it("should handle invalid token", () => {
        (jwt.verify as jest.Mock).mockImplementation(() => {
            throw new Error("Invalid token");
        });

        req.headers!["authorization"] = "Bearer invalidToken";
        authenticateToken("currentUser")(req as Request, res as Response, next);

        expect(ErrorFactory.unauthorized).toHaveBeenCalledWith(
            [],
            "Invalid token"
        );

        expect(next).toHaveBeenCalledWith(
            ErrorFactory.unauthorized([], "Invalid token")
        );
    });

    it("should handle expired token error", () => {
        const expiredTokenError = new Error("Expired token!");
        expiredTokenError.name = "TokenExpiredError";

        (jwt.verify as jest.Mock).mockImplementation(() => {
            throw expiredTokenError;
        })

        req.cookies = {token: "expiredToken"};

        authenticateToken("currentUser")(req as Request, res as Response, next);

        expect(ErrorFactory.unauthorized).toHaveBeenCalledWith([],"Token expired");
        expect(next).toHaveBeenCalledWith(
            ErrorFactory.unauthorized("Token expired")
        )
    })

    it("should handle malformed or empty in authorization header or cookies", () => {
        const middleware = authenticateToken("currentUser");

        req.headers!["authorization"] = "Bearer ";
        middleware(req as Request, res as Response, next);

        expect(ErrorFactory.unauthorized).toHaveBeenCalledWith([],
            "No token provided"
        );
        expect(next).toHaveBeenCalledWith(
            ErrorFactory.unauthorized("No token provided")
        )

        jest.resetAllMocks();

        req.headers = undefined;
        req.cookies = {token: ""};
        middleware(req as Request, res as Response, next);

        expect(ErrorFactory.unauthorized).toHaveBeenCalledWith([],"No token provided");
        expect(next).toHaveBeenCalledWith(
            ErrorFactory.unauthorized("No token provided")
        )
    })

    it("Should handle tokens with unexpected claims", () => {
        const malformedPayload = {id:1, username: "username"};

        (jwt.verify as jest.Mock).mockReturnValue(malformedPayload);

        req.headers!["auhtorization"] = "Bearer malformedToken";
        authenticateToken("currentUser")(req as Request, res as Response, next);

        expect(ErrorFactory.unauthorized).toHaveBeenCalledWith([],"No token provided");
        expect(next).toHaveBeenCalledWith(
            ErrorFactory.unauthorized("No token provided")
        )
    })

})
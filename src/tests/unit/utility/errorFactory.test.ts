import { ErrorFactory } from "../../../utility/errorFactory";

describe("Utility | errorFactory", () => {

    it("Should create badrequest error", () => {
        const details = {
            msg: "Invalid input", 
            param: "username"
        }

        const err = ErrorFactory.badRequest(details,"Invalid request")

        expect(err).toBeInstanceOf(Error);
        expect(err).toMatchObject({
            statusCode: 400,
            message:"Invalid request",
        })
    });

    it("Should create an internal error with message and no details", () => {
        const err = ErrorFactory.internal(undefined,"Unexpected error happended");
        
        expect(err).toBeInstanceOf(Error);
        expect(err).toMatchObject({
            statusCode:500,
            message:"Unexpected error happended"
        })
    });

    it("Should create a not Found error", () => {
        const err = ErrorFactory.notFound();

        expect(err).toBeInstanceOf(Error);
        expect(err).toMatchObject({
            statusCode:404,
            message:"Not found"
        });

    });

    it("Should create unauthorized error", () => {
        const details = [{ msg: "Token expired" }];

        const err = ErrorFactory.unauthorized(details,"Authentication failed")

        expect(err).toMatchObject({
            statusCode: 401,
            message: "Authentication failed",
            details
        });
    })

    it("Should create forbiden error without details", () => {
        const err = ErrorFactory.forbiden(undefined,"Access denied");

        expect(err).toMatchObject({
            statusCode: 403,
            message: "Access denied",
            details: undefined,
        });
    })

    it("Should create payloadTooLarge without arguments", () => {
        const err = ErrorFactory.payloadTooLarge();

        expect(err).toMatchObject({
            statusCode: 413,
            message: "Payload too large",
            details: undefined
        });
    });

    it("Should serialize into JSON correctly", () => {
        const details = [{msg:"Invalid data", field:"username" }];
        const err = ErrorFactory.badRequest(details,"Serialization test" )

        const json = JSON.stringify(err);
        expect(json).toContain('"message":"Serialization test"');
        expect(json).toContain('"statusCode":400');
        expect(json).toContain('"details":[{"msg":"Invalid data","field":"username"}]');
    })
})
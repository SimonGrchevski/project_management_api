import { CustomError } from "../types/customError";

export class ErrorFactory {

    static createError(
        statusCode: number = 500,
        options: { message?: string, details?: any } = { details:[], message:"Generic error"}
    ): CustomError {
        const err: CustomError = new Error(options.message);
        err.statusCode = statusCode;
        err.details = options.details;
        return err;
    }

    static badRequest(details?: any, message: string = "Bad request"): CustomError {
        return this.createError(400, { message, details });
    }

    static unauthorized(details?: any, message: string = "Unauthorized"): CustomError {
        return this.createError(401, { message, details });
    }

    static forbiden(details?: any, message: string = "Forbiden"): CustomError {
        return this.createError(403, { message, details });
    }

    static notFound(details?: any, message: string = "Not found"): CustomError {
        return this.createError(404, { message, details });
    }

    static payloadTooLarge(details?: any, message: string = "Payload too large"): CustomError {
        return this.createError(413, { message, details });
    }

    static manyRequests(details?: any, message: string = "Too many requests"): CustomError {
        return this.createError(429, { message, details });
    }

    static largeHeaders(details?: any, message: string = "Headers too large"): CustomError {
        return this.createError(431, { message, details });
    }

    static internal(details?: any, message: string = "Internal"): CustomError {
        return this.createError(500, { message, details });
    }
}
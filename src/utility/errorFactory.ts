import { CustomError } from "../types/customError";

export class ErrorFactory {

    static badRequest(details?: any, message: string = "Bad request"): CustomError {
        return new CustomError(400, { message, details });
    }

    static unauthorized(details?: any, message: string = "Unauthorized"): CustomError {
        return new CustomError(401, { message, details });
    }

    static forbiden(details?: any, message: string = "Forbiden"): CustomError {
        return new CustomError(403, { message, details });
    }

    static notFound(details?: any, message: string = "Not found"): CustomError {
        return new CustomError(404, { message, details });
    }

    static payloadTooLarge(details?: any, message: string = "Payload too large"): CustomError {
        return new CustomError(413, { message, details });
    }

    static manyRequests(details?: any, message: string = "Too many requests"): CustomError {
        return new CustomError(429, { message, details });
    }

    static largeHeaders(details?: any, message: string = "Headers too large"): CustomError {
        return new CustomError(431, { message, details });
    }

    static internal(details?: any, message: string = "Internal"): CustomError {
        return new CustomError(500, { message, details });
    }
}
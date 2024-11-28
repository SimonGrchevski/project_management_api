import {Request, Response, NextFunction} from "express";
import { validationResult } from "express-validator";

export const validateRequest = (
    req: Request,
    _: Response,
    next: NextFunction
) => {
    const err = validationResult(req);
    if(!err.isEmpty()) {
        const validationError = new Error("Validation failed");
        (validationError as any ).type = "validation";
        (validationError as any ).status = 400,
        (validationError as any ).errors = err.array();

        return next(validationError);
    }
    next();
}
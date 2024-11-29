import {Request, Response, NextFunction} from "express";
import { validationResult } from "express-validator";
import { ErrorFactory } from "../utility/errorFactory";

export const validateRequest = (
    req: Request,
    _: Response,
    next: NextFunction
) => {
    const err = validationResult(req);
    if(!err.isEmpty()) {
        return next(ErrorFactory.badRequest(err.array(),"Validation failed"));
    }
    next();
}
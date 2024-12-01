import {Request, Response, NextFunction} from "express";
import { validationResult } from "express-validator";
import { ErrorFactory } from "../utility/errorFactory";

export const validateRequest = (
    req: Request,
    _: Response,
    next: NextFunction
) => {
    try {
        const err = validationResult(req);
        if(!err.isEmpty()) {
            return next(ErrorFactory.badRequest(err.array(),"Validation failed"));
        }

        next();
    } catch(err) {
        next(ErrorFactory.internal(err, "Unexpected error in validation:"));
    }
   
}


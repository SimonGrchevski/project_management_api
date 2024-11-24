import { validationResult } from "express-validator";
import { Request, Response, NextFunction } from "express";

export const validateRequest = (req: Request, res: Response, nextFunc: NextFunction) => {
    const err = validationResult( req.body );
    if(!err.isEmpty()) {
        return res.send(400).json({errors:err.array()});
    }
    nextFunc();
}
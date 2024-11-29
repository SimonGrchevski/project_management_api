import {Request, Response, NextFunction} from "express";
import { CustomError } from "../types/customError";

export const errorHandler = (
    err: CustomError,
    req: Request,
    res: Response,
    _: NextFunction
): void => {

    const statusCode = err.statusCode || 500;
    const message = err.message;
    const details = err.details;

    res.status(statusCode).json({
        status: "error",
        message,
        errors: details ? [...details] : undefined
    })
};
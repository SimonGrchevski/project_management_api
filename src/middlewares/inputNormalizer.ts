import { Request, Response, NextFunction } from "express";
import { ErrorFactory } from "../utility/errorFactory";

const isSafeString = (value: unknown): value is string =>
    typeof value === "string" && value.trim().length > 0;

export const inputNormalizer = (fields: string[] = []) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        try {
            fields.forEach((field) => {
                if (req.body[field] && isSafeString(req.body[field])) {
                    req.body[field] = req.body[field].toLowerCase().trim();
                }
            });
            next();

        } catch (err) {
            next(ErrorFactory.internal(err,"Unexpected error in normalization:"));
        }
    };
};
import { Request, Response, NextFunction } from "express";

export const inputNormalizer = (fields: string[]) => {
    return (req: Request, res: Response, nextFunc: NextFunction): void => {
        fields.forEach((field) => {
            if (req.body[field]) {
                req.body[field] = req.body[field].toLowerCase().trim();
            }
        });
        nextFunc();
    };
};
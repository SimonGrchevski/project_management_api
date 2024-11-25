import { Request, Response, NextFunction } from "express";

export const inputNormalizer = (req: Request, res: Response, nextFunc: NextFunction):void => {
    req.body.username = req.body.username?.toLowerCase().trim();
    req.body.email = req.body.email?.toLowerCase().trim();
    nextFunc();
}
import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { Any } from "typeorm";

interface CustomRequest extends Request {
    [key: string]: any;
}

export const authenticateToken = (attachTo: string) => {
    return (req: CustomRequest, res: Response, nextFunc: NextFunction): void => {

        const authHeader = req.headers["authorization"];
        const tokenFromHeader = authHeader && authHeader.split(" ")[1]

        const tokenFromCookie = req.cookies?.token;

        const token = tokenFromHeader || tokenFromCookie;

        if (!token) {
            res.status(401).json({ msg: "No token provided" });
            return;
        }

        try {
            const decoded = jwt.verify(token, process.env.SECRET_KEY!);
            req[attachTo] = decoded;
            nextFunc();
        } catch (err: any) {

            if (err.name === "TokenExpiredError") {
                res.status(401).json({ msg: "Token expired" });
            }
            res.status(401).json({ msg: "Invalid token" });
            return;
        }
    };
};
import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { ErrorFactory } from "../utility/errorFactory";

interface CustomRequest extends Request {
    [key: string]: any;
}

export const authenticateToken = (attachTo: string) => {
    return (req: CustomRequest, res: Response, next: NextFunction): void => {

        const authHeader = req.headers && req.headers["authorization"];
        const tokenFromHeader = authHeader && authHeader.split(" ")[1]

        const tokenFromCookie = req.cookies?.token;

        const token = tokenFromHeader || tokenFromCookie;

        if (!token)
            return next(ErrorFactory.unauthorized([],"No token provided"));

        
        try {
            const decoded = jwt.verify(token, process.env.SECRET_KEY!, {
                audience: process.env.AUD,
                issuer: process.env.ISS,
                algorithms: ["HS256"]
            });
            
            req[attachTo] = decoded;
            next();
        } catch (err: any) {
            

            if (err.name === "TokenExpiredError") 
                return next(ErrorFactory.unauthorized([],"Token expired"));

            return next(ErrorFactory.unauthorized([],"Invalid token"))
        }
    };
};
import {Request, Response, NextFunction} from "express";

export const errorHandler = (
    err: any,
    req: Request,
    res: Response,
    _: NextFunction
): void => {
    switch (err.type) {
        case "entity.too.large":
            res.status(413).json({ msg: "Payload too large" });
            break;
        case "validation":
            res.status(err.status || 400).json({
                msg:err.message || "Validation failed",
                errors: err.errors || []
            });
            break;
        default:
            console.error("Unhandled error:", err);
            res.status(err.status || 500).json({ msg: err.message || "Internal server error" });
    }
};
import { ErrorRequestHandler, Request, Response, NextFunction } from "express";
import { ErrorFactory } from "../utility/errorFactory";

export const malformedJson: ErrorRequestHandler = (
    err: Error,
    req: Request,
    res: Response,
    nextFunc: NextFunction
): void => {
    console.error("Inside it!");
    if (err instanceof SyntaxError && "body" in err && (err as any).status === 400) {
        return nextFunc(ErrorFactory.badRequest([],"Invalid JSON payload"));
    }
    console.error("Not an error?");
    nextFunc(err);
};
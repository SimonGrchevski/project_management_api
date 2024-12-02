import { ErrorRequestHandler, Request, Response, NextFunction } from "express";
import { ErrorFactory } from "../utility/errorFactory";

export const malformedJson: ErrorRequestHandler = (
    err: Error,
    req: Request,
    res: Response,
    nextFunc: NextFunction
): void => {
    if (err instanceof SyntaxError && "body" in err && (err as any).status === 400) {
        return nextFunc(ErrorFactory.badRequest([],"Invalid JSON payload"));
    }

    nextFunc(err);
};
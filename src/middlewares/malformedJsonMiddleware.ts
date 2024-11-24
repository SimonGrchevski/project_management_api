import { ErrorRequestHandler, Request, Response, NextFunction } from "express";

export const MalformJsonMiddleware: ErrorRequestHandler = (
    err: Error,
    req: Request,
    res: Response,
    nextFunc: NextFunction
): void => {
    console.log("Malformed JSON middleware triggered");

    if (err instanceof SyntaxError && "body" in err && (err as any).status === 400) {
        res.status(400).json({ msg: "Invalid JSON payload" });
        return;
    }

    nextFunc(err);
};
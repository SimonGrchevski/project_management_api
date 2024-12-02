import { Response, NextFunction } from "express";
import { CustomRequest } from "../types/customRequest";
import { ErrorFactory } from "../utility/errorFactory";

export const verifyOwnership = async (
    req: CustomRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    const tokenUserId = req.currentUser?.id;
    const targetUserId = req.body?.id || req.params?.userId;

    if (!targetUserId) {
        return next(ErrorFactory.forbiden("Id is missing"));
    }

    if (!tokenUserId) {
        return next(ErrorFactory.unauthorized("Token is invalid or missing"));
    }

    if (tokenUserId !== targetUserId) {
        return next(ErrorFactory.forbiden("You not authorized to update this user."));
    }

    next();
};
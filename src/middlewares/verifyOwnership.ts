import { Response, NextFunction } from "express";
import { CustomRequest } from "../types/customRequest";
export const verifyOwnership = async (
    req: CustomRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    const tokenUserId = req.currentUser?.id;
    const targetUserId = req.body.id || req.params.userId;

    if (!targetUserId) {
        res.status(403).json({ msg: "Unauthorized to update this user" });
        return;
    }

    if (!tokenUserId) {
        res.status(401).json({ msg: "Invalid token" });
        return;
    }

    if (tokenUserId !== targetUserId) {
        res.status(403).json({ msg: "Unauthorized to update this user" });
        return;
    }

    next();
};
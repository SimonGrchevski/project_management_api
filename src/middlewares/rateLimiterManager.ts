import rateLimit from "express-rate-limit";
import { Request } from "express";
import { RATE_LIMIT_CONFIG } from "../config/constants";

interface RateLimiterManager {
    middleware: ReturnType<typeof rateLimit>;
    resetAllKeys: () => void;
    resetKey: (key: string) => void;
    addKey: (key: string) => void;
    getUsedKeys: () => string[];
}

const usedKeys = new Set<string>();

const createRateLimiterManager = (): RateLimiterManager => {
    const middleware = rateLimit({
        windowMs: RATE_LIMIT_CONFIG.WINDOW_MS,
        max: RATE_LIMIT_CONFIG.MAX_REQUESTS,
        message: {
            msg: "Too many requests, please try again later",
        },
        standardHeaders: true,
        legacyHeaders: false,
        keyGenerator: (req: Request) => {
            const forwarded = req.headers["x-forwarded-for"];
            const clientIp = Array.isArray(forwarded) ? forwarded[0] : forwarded;
            const key = clientIp || req.ip || "unknown";

            if (process.env.NODE_ENV === "test") {
                usedKeys.add(key);
            }

            return key;
        },
    });

    return {
        middleware,
        resetAllKeys: () => {
            usedKeys.forEach((key) => middleware.resetKey(key));
            usedKeys.clear();
        },
        resetKey: (key: string) => {
            middleware.resetKey(key);
            usedKeys.delete(key);
        },
        addKey: (key: string) => {
            usedKeys.add(key);
        },
        getUsedKeys: () => Array.from(usedKeys),
    };
};

export const rateLimiterManager = createRateLimiterManager();
export default createRateLimiterManager;

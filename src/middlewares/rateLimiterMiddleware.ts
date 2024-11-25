import rateLimit from "express-rate-limit";
import { RATE_LIMIT_CONFIG } from "../config/constants";

export const rateLimiterMiddleware = rateLimit({
    windowMs: RATE_LIMIT_CONFIG.WINDOW_MS,
    max: RATE_LIMIT_CONFIG.MAX_REQUESTS,
    message: {
        msg:RATE_LIMIT_CONFIG.ERROR_MESSAGE
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        return RATE_LIMIT_CONFIG.CLIENT_KEY || req.ip || "unknown";
    },
});
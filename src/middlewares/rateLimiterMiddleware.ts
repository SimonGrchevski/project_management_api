import rateLimit from "express-rate-limit";

export const rateLimiterMiddleware = rateLimit({
    windowMs: 60*1000,
    max: 10,
    message: {
        msg:"Too many requests, please try again later"
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        return process.env.NODE_ENV === "test" ? "test-client" : req.ip || "unknown";
    },
});
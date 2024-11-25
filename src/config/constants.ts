export const RATE_LIMIT_CONFIG = {
    WINDOW_MS: process.env.NODE_ENV === "test" ? 1000 : 60 * 1000,
    MAX_REQUESTS: 10,
    ERROR_MESSAGE: "Too many requests, please try again later",
    CLIENT_KEY: process.env.NODE_ENV === "test" ? "test-client" : undefined
};
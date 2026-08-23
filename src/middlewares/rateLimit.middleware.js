import rateLimit from "express-rate-limit";

export const authRateLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 10,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
        success: false,
        error: {
            code: "RATE_LIMIT_EXCEEDED",
            message: "Too many authentication requests. Please try again later.",
        },
    },
});

export const resetAuthRateLimit = (ip) => authRateLimiter.resetKey(ip);

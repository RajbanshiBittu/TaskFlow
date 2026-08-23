export class AppError extends Error {
    constructor(message, statusCode, errorCode, details = null) {
        // Preserve older call sites that used (code, message, status, details).
        if (typeof message === "string" && typeof statusCode === "string" && typeof errorCode === "number") {
            [message, statusCode, errorCode] = [statusCode, errorCode, message];
        }

        super(message);

        this.name = "AppError";
        this.statusCode = statusCode;
        this.errorCode = errorCode;
        this.details = details;

        Error.captureStackTrace(this, this.constructor);
    }
}
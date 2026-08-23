import { HTTP_STATUS } from "../constants/httpStatus.js";
import { logger } from "../config/logger.js";

export const errorHandler = (err, req, res, next) => {
    const statusCode =
        err.statusCode ||
        HTTP_STATUS.INTERNAL_SERVER_ERROR;

    const response = {
        success: false,
        error: {
            code:
                err.errorCode ||
                "INTERNAL_SERVER_ERROR",

            message:
                statusCode === HTTP_STATUS.INTERNAL_SERVER_ERROR
                    ? "Internal server error"
                    : err.message || "Something went wrong.",
        },
    };

    if (err.details) {
        response.error.details = err.details;
    }

    logger.error(
        {
            err,
            method: req.method,
            url: req.originalUrl,
            statusCode,
        },
        "Request failed"
    );

    return res
        .status(statusCode)
        .json(response);
};
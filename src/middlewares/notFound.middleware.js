import { HTTP_STATUS } from "../constants/httpStatus.js";

export const notFoundHandler = (req, res) => {
    return res
        .status(HTTP_STATUS.NOT_FOUND)
        .json({
            success: false,
            error: {
                code: "ROUTE_NOT_FOUND",
                message: `Cannot ${req.method} ${req.originalUrl}`,
            },
        });
};